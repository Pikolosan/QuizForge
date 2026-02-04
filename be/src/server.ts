import express from 'express';
import cors from 'cors';
import quizRoutes from './routes/quizrouter';
import { connectMongo, closeDatabase } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting server...');
console.log('📁 Environment variables loaded');

// Spin up the Express app
const app = express();
const PORT = process.env.PORT || 3001;

console.log(`🌐 Server will run on port: ${PORT}`);

// CORS Configuration - MUST be before other middleware
// Read allowed origins from environment (comma-separated) for flexibility in deploys
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://nebulaquiz.vercel.app',
  'https://online-quiz-application-1.onrender.com'
];
const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

console.log('🔐 CORS allowed origins:', allowedOrigins);

// Use a function so we always reflect the exact Origin header when it matches our list
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

// Apply CORS globally
app.use(cors(corsOptions));

app.use(express.json());

// Middleware with logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

console.log('✅ Middleware configured');

// Routes
app.use('/api', quizRoutes);
console.log('✅ Routes configured');

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Quiz API is running' });
});

// Last-chance error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to MongoDB and then start server
connectMongo().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🎉 Server is running successfully on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Assessment endpoint: http://localhost:${PORT}/api/ai-assessment/generate`);
    console.log(`✅ Backend ready to receive requests!`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB. Server not started.', err);
  process.exit(1);
});

export default app;