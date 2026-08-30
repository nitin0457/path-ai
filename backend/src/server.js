import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import learningRoutes from './routes/learning.js';
import aiRoutes from './routes/ai.js';
import feedbackRoutes from './routes/feedback.js';
import featureRoutes from './routes/features.js';

const app = express();

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (Postman, curl, server-to-server).
    if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'learnpath-ai-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/learning-path', learningRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/features', featureRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Internal server error' });
});

connectDB()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`);
      console.log(`Allowed clients: ${env.clientUrls.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    console.error('Make sure MongoDB is running and MONGO_URI is correct.');
    process.exit(1);
  });
