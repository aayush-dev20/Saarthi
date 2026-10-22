import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedDatabase } from './scripts/seed.js';
import { User } from './models/User.js';

// Route imports
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import facultyRoutes from './routes/faculty.routes.js';
import adminRoutes from './routes/admin.routes.js';
import transportRoutes from './routes/transport.routes.js';
import hostelRoutes from './routes/hostel.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initSocketIO(httpServer);

// Middleware
app.use(cors({
  origin: true, // Allow Vite dev server and browser clients
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`📡 [${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/attendance', attendanceRoutes);

// Fallback 404 for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Serve Frontend static assets from dist
app.use(express.static(distPath));

// Fallback all frontend routes to index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/socket.io')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile('index.html', { root: distPath });
    }
  }
  next();
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is freshly initiated with zero users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Auto-seeding initial academic records...');
      await seedDatabase();
    }

    httpServer.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Saarthi Backend Server running on http://localhost:${PORT}`);
      console.log(`⚡ WebSocket Server active & listening for real-time events`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('❌ Failed to launch Saarthi Backend:', err);
    process.exit(1);
  }
}

// Graceful termination handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down Saarthi backend server...');
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  httpServer.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

startServer();

export { app, httpServer };
