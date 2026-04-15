// backend/src/controllers/documentController.js
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { query } = require('../config/database');

// @route GET /api/documents
const getDocuments = async (req, res, next) => {
  try {
    // Only returns documents belonging to authenticated user (exclude deleted)
    const result = await query(
      `SELECT id, title, is_public, is_bookmarked, share_token, updated_at, created_at
       FROM documents
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_bookmarked DESC, updated_at DESC`,
      [req.user.id]
    );

    res.status(200).json({ success: true, documents: result.rows });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/documents
const createDocument = async (req, res, next) => {
  try {
    const { title = 'Untitled' } = req.body;

    const result = await query(
      `INSERT INTO documents (user_id, title)
       VALUES ($1, $2)
       RETURNING id, user_id, title, is_public, is_bookmarked, share_token, updated_at, created_at`,
      [req.user.id, title]
    );

    const doc = result.rows[0];

    // Create a default first empty paragraph block
    await query(
      `INSERT INTO blocks (document_id, type, content, order_index)
       VALUES ($1, 'paragraph', '{"text":""}', 1000.0)`,
      [doc.id]
    );

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/documents/:id
// CRITICAL: Verifies document belongs to requesting user — returns 403 if not
const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = result.rows[0];

    // OWNERSHIP CHECK — must return 403 if user doesn't own the document
    if (doc.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this document.',
      });
    }

    // Fetch all blocks ordered by order_index (exclude deleted)
    const blocksResult = await query(
      `SELECT id, document_id, type, content, order_index, parent_id, created_at
       FROM blocks
       WHERE document_id = $1 AND deleted_at IS NULL
       ORDER BY order_index ASC`,
      [id]
    );

    res.status(200).json({
      success: true,
      document: doc,
      blocks: blocksResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/documents/:id
const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, is_bookmarked: isBookmarked } = req.body;

    // Ownership check
    const existing = await query('SELECT user_id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (isBookmarked !== undefined) {
      fields.push(`is_bookmarked = $${paramIndex}`);
      values.push(Boolean(isBookmarked));
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(id);
    const result = await query(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, title, is_public, is_bookmarked, share_token, updated_at`,
      values
    );

    res.status(200).json({ success: true, document: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT user_id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Soft delete: set deleted_at timestamp
    const result = await query(
      'UPDATE documents SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Document not found or already deleted.' });
    }

    res.status(200).json({ success: true, message: 'Document moved to trash.' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/documents/:id/share — Enable sharing
const enableSharing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT user_id, share_token FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Generate or reuse share token
    let token = existing.rows[0].share_token;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
    }

    const result = await query(
      `UPDATE documents SET share_token = $1, is_public = TRUE WHERE id = $2
       RETURNING id, share_token, is_public`,
      [token, id]
    );

    res.status(200).json({ success: true, document: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/documents/:id/share — Disable sharing (invalidates token)
const disableSharing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT user_id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Null out the token — invalidates any existing share links
    await query(
      'UPDATE documents SET share_token = NULL, is_public = FALSE WHERE id = $1',
      [id]
    );

    res.status(200).json({ success: true, message: 'Sharing disabled. Previous links are invalidated.' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/documents/search?q=query
const searchDocuments = async (req, res, next) => {
  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const searchTerm = searchQuery.trim();

    // Search in document titles and block content
    const result = await query(`
      SELECT DISTINCT d.id, d.title, d.is_public, d.is_bookmarked, d.share_token, d.updated_at, d.created_at
      FROM documents d
      LEFT JOIN blocks b ON d.id = b.document_id
      WHERE d.user_id = $1
        AND (
          d.title ILIKE $2
          OR b.content->>'text' ILIKE $2
          OR b.content->>'html' ILIKE $2
        )
      ORDER BY d.is_bookmarked DESC, d.updated_at DESC
    `, [req.user.id, `%${searchTerm}%`]);

    res.status(200).json({ success: true, documents: result.rows, query: searchTerm });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/share/:token — Public read-only access via share token
const getSharedDocument = async (req, res, next) => {
  try {
    const doc = req.sharedDocument; // Populated by shareTokenAccess middleware

    const blocksResult = await query(
      `SELECT id, document_id, type, content, order_index, parent_id
       FROM blocks
       WHERE document_id = $1
       ORDER BY order_index ASC`,
      [doc.id]
    );

    res.status(200).json({
      success: true,
      document: { id: doc.id, title: doc.title, updated_at: doc.updated_at },
      blocks: blocksResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/documents/trash
const getTrashedDocuments = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, title, is_public, is_bookmarked, share_token, deleted_at, updated_at, created_at FROM documents WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC',
      [req.user.id]
    );

    res.status(200).json({ success: true, documents: result.rows });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/documents/:id/restore
const restoreDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT user_id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Restore: set deleted_at to NULL
    const result = await query(
      'UPDATE documents SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Document not found in trash.' });
    }

    res.status(200).json({ success: true, message: 'Document restored.' });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/documents/:id/permanent
const permanentDeleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT user_id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Permanent delete: actually remove from database (cascade deletes blocks)
    const result = await query(
      'DELETE FROM documents WHERE id = $1 AND deleted_at IS NOT NULL',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Document not found in trash.' });
    }

    res.status(200).json({ success: true, message: 'Document permanently deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  enableSharing,
  disableSharing,
  getSharedDocument,
  searchDocuments,
  getTrashedDocuments,
  restoreDocument,
  permanentDeleteDocument,
};
