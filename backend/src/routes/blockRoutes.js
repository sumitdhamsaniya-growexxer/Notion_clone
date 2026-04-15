// backend/src/routes/blockRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { shareTokenAccess } = require('../middleware/shareMiddleware');
const { createBlock, updateBlock, deleteBlock, reorderBlocks, batchSave, getTrashedBlocks, restoreBlock, permanentDeleteBlock } = require('../controllers/blockController');
const { getSharedDocument } = require('../controllers/documentController');

const router = express.Router({ mergeParams: true });

// All block mutation routes require JWT auth
router.use(protect);

router.post('/', createBlock);
router.patch('/:blockId', updateBlock);
router.delete('/:blockId', deleteBlock);
router.post('/reorder', reorderBlocks);
router.post('/batch', batchSave);

// Trash routes
router.get('/trash', getTrashedBlocks);
router.post('/:blockId/restore', restoreBlock);
router.delete('/:blockId/permanent', permanentDeleteBlock);

module.exports = router;
