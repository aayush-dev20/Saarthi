import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Saarthi Academic Backend API',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    uptime: process.uptime(),
  });
});

export default router;
