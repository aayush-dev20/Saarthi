import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const persistentDbPath = path.resolve(__dirname, '../../data/db');

let mongoMemoryServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (uri) {
    try {
      console.log('🔄 Connecting to configured MongoDB Atlas / Server...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Connected to MongoDB at:', uri.split('@').pop()?.split('?')[0] || uri);
      return;
    } catch (err) {
      console.warn('⚠️ Could not connect to configured MONGODB_URI:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.log('🔄 Falling back to persistent local MongoDB database...');
    }
  }

  // Persistent Local MongoDB Engine
  try {
    console.log('🔄 Starting persistent local MongoDB database at:', persistentDbPath);
    fs.mkdirSync(persistentDbPath, { recursive: true });

    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath: persistentDbPath,
      },
    });
    const memUri = mongoMemoryServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅ Connected to persistent MongoDB at:', memUri);
  } catch (err) {
    console.error('❌ Failed to start persistent MongoDB:', err);
    throw err;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('🛑 MongoDB disconnected gracefully.');
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  }
}
