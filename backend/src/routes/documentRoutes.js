// backend/src/routes/documentRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getDocuments, createDocument, getDocument,
  updateDocument, deleteDocument, enableSharing, disableSharing,
  searchDocuments, getTrashedDocuments, restoreDocument, permanentDeleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

router.use(protect); // All document routes require auth

router.get('/search', searchDocuments);
router.get('/trash', getTrashedDocuments);
router.get('/', getDocuments);
router.post('/', createDocument);
router.post('/:id/restore', restoreDocument);
router.delete('/:id/permanent', permanentDeleteDocument);
router.post('/:id/share', enableSharing);
router.delete('/:id/share', disableSharing);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
