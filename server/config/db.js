import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
      console.log('🔄 Falling back to isolated in-memory MongoDB for local evaluation...');
    }
  }

  // Development In-Memory Fallback
  try {
    console.log('🔄 Starting isolated In-Memory MongoDB Server for testing...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memUri = mongoMemoryServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅ Connected to In-Memory MongoDB Server at:', memUri);
  } catch (err) {
    console.error('❌ Failed to start In-Memory MongoDB:', err);
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
