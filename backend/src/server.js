// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const blockRoutes = require('./routes/blockRoutes');
const { shareTokenAccess } = require('./middleware/shareMiddleware');
const { getSharedDocument } = require('./controllers/documentController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 10;

// Connect DB
connectDB();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    const isLocalhostOrigin = typeof origin === 'string'
      && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (!origin || allowedOrigins.includes(origin) || isLocalhostOrigin) {
      return cb(null, true);
    }
    // Reject cross-origin without throwing server errors.
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Too many requests, try again later.' },
});
app.use('/api', limiter);

app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/documents/:documentId/blocks', blockRoutes);

// Share route — read-only, no JWT required
// shareTokenAccess middleware rejects any non-GET at the middleware level
app.get('/api/share/:token', shareTokenAccess, getSharedDocument);
// Explicitly reject mutations on share routes at the API level
app.all('/api/share/:token', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Share token grants read-only access.',
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

let server;
const startServer = (port, retries = 0) => {
  const instance = app.listen(port, () => {
    console.log(`\n🚀 Server running on port ${port} [${process.env.NODE_ENV}]`);
    console.log(`📡 API: http://localhost:${port}/api`);
  });

  instance.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev && retries < MAX_PORT_RETRIES) {
        const nextPort = port + 1;
        console.warn(`\n⚠️ Port ${port} is in use. Retrying on ${nextPort}...`);
        server = startServer(nextPort, retries + 1);
        return;
      }

      console.error(`\n❌ Port ${port} is already in use.`);
      console.error('Stop the existing process or set a different PORT in backend/.env.');
      process.exit(1);
    }

    console.error('Server startup error:', err);
    process.exit(1);
  });

  return instance;
};

server = startServer(BASE_PORT);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = server;
