// backend/src/routes/documentRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getDocuments, createDocument, getDocument,
  updateDocument, deleteDocument, enableSharing, disableSharing,
  searchDocuments,
} = require('../controllers/documentController');

const router = express.Router();

router.use(protect); // All document routes require auth

router.get('/search', searchDocuments);
router.get('/', getDocuments);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/share', enableSharing);
router.delete('/:id/share', disableSharing);

module.exports = router;
