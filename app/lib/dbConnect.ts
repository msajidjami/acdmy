// app/lib/dbConnect.ts

import mongoose, { type Connection, type ConnectOptions, type Mongoose } from 'mongoose';

// Environment variable سے URI لیں یا default استعمال کریں
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acadmy';

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is not defined in environment variables');
}

// Global type declaration - درست تیپس کے ساتھ
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

// Global cache variable - تیپس واضح طور پر
const cached: { conn: Mongoose | null; promise: Promise<Mongoose> | null } = 
  global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Utility function to check if MongoDB is running
async function checkMongoDBConnection(): Promise<boolean> {
  try {
    // Quick connection test without caching
    const testConnection = await mongoose.createConnection(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    }).asPromise();
    
    await testConnection.close();
    return true;
  } catch (error) {
    return false;
  }
}

// Main connection function
export async function dbConnect(): Promise<Mongoose> {
  // If already connected and connection is healthy, return cached connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Using existing MongoDB connection');
    }
    return cached.conn;
  }

  // If connection is in connecting state, wait for the promise
  if (mongoose.connection.readyState === 2) {
    if (cached.promise) {
      cached.conn = await cached.promise;
      return cached.conn;
    }
  }

  // Create new connection
  if (!cached.promise) {
    const isMongoRunning = await checkMongoDBConnection();
    
    if (!isMongoRunning) {
      console.warn('⚠️ MongoDB is not running. Please start MongoDB service.');
      console.warn('   Command to start MongoDB:');
      console.warn('   - Windows: net start MongoDB');
      console.warn('   - macOS: brew services start mongodb-community');
      console.warn('   - Linux: sudo systemctl start mongod');
      console.warn(`   Connection URI: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);
      
      // Throw error for production, but allow fallback for development
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MongoDB connection failed');
      }
    }

    const opts: ConnectOptions = {
      bufferCommands: true,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4,
      retryWrites: true,
      w: 'majority',
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 10000,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 Attempting MongoDB connection to: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);
    }

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ MongoDB Connected Successfully!');
          console.log(`📊 Database: ${mongooseInstance.connection.db?.databaseName ?? 'unknown'}`);
          console.log(`🌐 Host: ${mongooseInstance.connection.host}`);
          console.log(`📈 Connection State: ${mongooseInstance.connection.readyState} (1 = connected)`);
        }
        return mongooseInstance;
      })
      .catch((error) => {
        // Reset promise on error
        cached.promise = null;
        
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('   Possible solutions:');
        console.error('   1. Make sure MongoDB service is running');
        console.error('   2. Check if MongoDB is installed');
        console.error('   3. Verify connection string in .env.local');
        console.error('   4. Try: mongod --dbpath ./data/db');
        
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    
    // For development, provide more helpful error
    if (process.env.NODE_ENV === 'development') {
      console.error('\n🔧 Troubleshooting steps:');
      console.error('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
      console.error('   2. Start MongoDB service');
      console.error('   3. Or use MongoDB Atlas (cloud) instead');
      console.error('   4. Check if port 27017 is in use');
    }
    
    throw error;
  }
}

// Connection event handlers for better debugging
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ MongoDB disconnected');
  }
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('reconnected', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 MongoDB reconnected');
  }
});

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
}

export default dbConnect;