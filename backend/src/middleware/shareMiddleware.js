// backend/src/middleware/shareMiddleware.js
// This middleware is used for share token routes
// It ONLY allows GET requests — all mutations are rejected at API level
const { query } = require('../config/database');

const shareTokenAccess = async (req, res, next) => {
  try {
    // CRITICAL: Reject any non-GET request using a share token
    // This enforces read-only at the API level, not just the frontend
    if (req.method !== 'GET') {
      return res.status(403).json({
        success: false,
        message: 'Share token grants read-only access. Mutations are not allowed.',
      });
    }

    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Share token required.' });
    }

    // Parameterized query — find document by share token
    const result = await query(
      'SELECT * FROM documents WHERE share_token = $1 AND is_public = TRUE',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or sharing has been disabled.',
      });
    }

    req.sharedDocument = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { shareTokenAccess };
