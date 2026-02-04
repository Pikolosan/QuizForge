import express from 'express';
import cors from 'cors';
import quizRoutes from './routes/quizrouter';
import { closeDatabase } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting server...');
console.log('📁 Environment variables loaded');

// Spin up the Express app
const app = express();
const PORT = process.env.PORT || 3001;

console.log(`🌐 Server will run on port: ${PORT}`);

// CORS Configuration - MUST be before other middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://nebulaquiz.vercel.app', // Replace with your actual Vercel URL
    'https://online-quiz-application-1.onrender.com'
  ],
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

const server = app.listen(PORT, () => {
  console.log(`🎉 Server is running successfully on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Assessment endpoint: http://localhost:${PORT}/api/ai-assessment/generate`);
  console.log(`✅ Backend ready to receive requests!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
});

export default app;