// backend/src/controllers/blockController.js
const { query } = require('../config/database');

// Helper: verify document ownership
const verifyOwnership = async (documentId, userId) => {
  const result = await query(
    'SELECT user_id FROM documents WHERE id = $1',
    [documentId]
  );
  if (result.rows.length === 0) return { error: 'Document not found.', status: 404 };
  if (result.rows[0].user_id !== userId) return { error: 'Access denied.', status: 403 };
  return { ok: true };
};

// Helper: Re-normalize order_index values if gap < 0.001
// This prevents floating point precision loss after many reorders
const renormalizeIfNeeded = async (documentId) => {
  const result = await query(
    'SELECT id, order_index FROM blocks WHERE document_id = $1 ORDER BY order_index ASC',
    [documentId]
  );

  const blocks = result.rows;
  let needsRenorm = false;

  for (let i = 0; i < blocks.length - 1; i++) {
    const gap = parseFloat(blocks[i + 1].order_index) - parseFloat(blocks[i].order_index);
    if (gap < 0.001) {
      needsRenorm = true;
      break;
    }
  }

  if (needsRenorm && blocks.length > 0) {
    console.log(`[Re-normalize] Renormalizing ${blocks.length} blocks in document ${documentId}`);
    // Re-assign evenly spaced values with large gaps
    const client = await require('../config/database').pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < blocks.length; i++) {
        await client.query(
          'UPDATE blocks SET order_index = $1 WHERE id = $2',
          [(i + 1) * 1000.0, blocks[i].id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

// @route POST /api/documents/:documentId/blocks
const createBlock = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { type = 'paragraph', content = { text: '' }, order_index, parent_id = null } = req.body;

    // Validate block type
    const validTypes = ['paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image'];
    if (!validTypes.includes(type)) {
      return res.status(422).json({
        success: false,
        message: `Invalid block type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const ownership = await verifyOwnership(documentId, req.user.id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({ success: false, message: ownership.error });
    }

    // Validate order_index is a number
    if (order_index === undefined || isNaN(parseFloat(order_index))) {
      return res.status(422).json({ success: false, message: 'order_index is required and must be a number.' });
    }

    const result = await query(
      `INSERT INTO blocks (document_id, type, content, order_index, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, document_id, type, content, order_index, parent_id, created_at`,
      [documentId, type, JSON.stringify(content), parseFloat(order_index), parent_id]
    );

    // Check if renormalization is needed after insert
    await renormalizeIfNeeded(documentId);

    res.status(201).json({ success: true, block: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/documents/:documentId/blocks/:blockId
const updateBlock = async (req, res, next) => {
  try {
    const { documentId, blockId } = req.params;
    const { type, content, order_index } = req.body;

    const ownership = await verifyOwnership(documentId, req.user.id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({ success: false, message: ownership.error });
    }

    // Verify block belongs to this document
    const existing = await query(
      'SELECT id FROM blocks WHERE id = $1 AND document_id = $2',
      [blockId, documentId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Block not found.' });
    }

    // Validate block type if provided
    if (type) {
      const validTypes = ['paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image'];
      if (!validTypes.includes(type)) {
        return res.status(422).json({ success: false, message: 'Invalid block type.' });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (type !== undefined) { fields.push(`type = $${idx}`); values.push(type); idx++; }
    if (content !== undefined) { fields.push(`content = $${idx}`); values.push(JSON.stringify(content)); idx++; }
    if (order_index !== undefined) { fields.push(`order_index = $${idx}`); values.push(parseFloat(order_index)); idx++; }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(blockId);
    const result = await query(
      `UPDATE blocks SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, document_id, type, content, order_index, parent_id`,
      values
    );

    if (order_index !== undefined) {
      await renormalizeIfNeeded(documentId);
    }

    res.status(200).json({ success: true, block: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/documents/:documentId/blocks/:blockId
const deleteBlock = async (req, res, next) => {
  try {
    const { documentId, blockId } = req.params;

    const ownership = await verifyOwnership(documentId, req.user.id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({ success: false, message: ownership.error });
    }

    await query(
      'DELETE FROM blocks WHERE id = $1 AND document_id = $2',
      [blockId, documentId]
    );

    res.status(200).json({ success: true, message: 'Block deleted.' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/documents/:documentId/blocks/reorder
// Batch reorder — receives array of {id, order_index}
const reorderBlocks = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { blocks } = req.body; // [{id, order_index}, ...]

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return res.status(422).json({ success: false, message: 'blocks array is required.' });
    }

    const ownership = await verifyOwnership(documentId, req.user.id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({ success: false, message: ownership.error });
    }

    const client = await require('../config/database').pool.connect();
    try {
      await client.query('BEGIN');
      for (const block of blocks) {
        await client.query(
          'UPDATE blocks SET order_index = $1 WHERE id = $2 AND document_id = $3',
          [parseFloat(block.order_index), block.id, documentId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await renormalizeIfNeeded(documentId);

    res.status(200).json({ success: true, message: 'Blocks reordered.' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/documents/:documentId/blocks/batch
// Batch save for auto-save — creates/updates/deletes blocks in one request
// Server-side version check prevents stale overwrites
const batchSave = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { blocks, documentVersion } = req.body;

    const ownership = await verifyOwnership(documentId, req.user.id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({ success: false, message: ownership.error });
    }

    // Version check — prevents stale auto-save from overwriting newer content
    const docResult = await query(
      'SELECT version FROM documents WHERE id = $1',
      [documentId]
    );
    const currentVersion = docResult.rows[0]?.version || 0;

    if (documentVersion !== undefined && documentVersion < currentVersion) {
      return res.status(409).json({
        success: false,
        message: 'Stale write rejected. Document has been updated by a newer save.',
        currentVersion,
      });
    }

    const client = await require('../config/database').pool.connect();
    try {
      await client.query('BEGIN');

      for (const block of blocks) {
        const validTypes = ['paragraph', 'heading_1', 'heading_2', 'todo', 'code', 'divider', 'image'];
        if (!validTypes.includes(block.type)) {
          throw new Error(`Invalid block type: ${block.type}`);
        }

        await client.query(
          `INSERT INTO blocks (id, document_id, type, content, order_index, parent_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             type = EXCLUDED.type,
             content = EXCLUDED.content,
             order_index = EXCLUDED.order_index`,
          [
            block.id,
            documentId,
            block.type,
            JSON.stringify(block.content || {}),
            parseFloat(block.order_index),
            block.parent_id || null,
          ]
        );
      }

      // Increment version
      await client.query(
        'UPDATE documents SET version = version + 1 WHERE id = $1',
        [documentId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await renormalizeIfNeeded(documentId);

    const newVersion = await query('SELECT version FROM documents WHERE id = $1', [documentId]);
    res.status(200).json({ success: true, version: newVersion.rows[0].version });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBlock, updateBlock, deleteBlock, reorderBlocks, batchSave };
