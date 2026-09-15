// app/lib/dbConnect.ts

import mongoose, { type Mongoose, type ConnectOptions } from 'mongoose';

// ============================================================
// Environment
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is not defined in environment variables');
}

// ============================================================
// Global cache — serverless (Vercel) میں connection reuse کے لیے
// ============================================================
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

// ============================================================
// Connection options — serverless-friendly
// ============================================================
const MONGOOSE_OPTS: ConnectOptions = {
  bufferCommands: false,          // ✅ serverless میں hang نہیں ہوگا
  maxPoolSize: 10,
  minPoolSize: 0,                 // ✅ serverless میں idle connections نہ رکھیں
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4,
  retryWrites: true,
  w: 'majority',
  // ❌ maxIdleTimeMS ہٹا دیا — default (0 = never) بہتر ہے
  // ❌ heartbeatFrequencyMS ہٹا دیا — default fine
};

// ============================================================
// Main connection
// ============================================================
async function dbConnect(): Promise<Mongoose> {
  // ✅ پہلے سے connected — فوراً return
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // ✅ Promise in-flight — اسی کا انتظار
  if (cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // ✅ نیا connection بنائیں
  cached.promise = mongoose
    .connect(MONGODB_URI!, MONGOOSE_OPTS)
    .then((m) => {
      console.log('✅ MongoDB connected:', m.connection.host);
      return m;
    })
    .catch((err) => {
      cached.promise = null;
      console.error('❌ MongoDB connection error:', err?.message || err);
      throw err;
    });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

// ============================================================
// Event handlers — صرف logging، کوئی state mutate نہیں
// ============================================================
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
  cached.conn = null;
  cached.promise = null;
});

// ❌ SIGINT handler ہٹا دیا — serverless میں غیر ضروری
// ❌ checkMongoDBConnection ہٹا دیا — اضافی connection بناتا تھا

export default dbConnect;
export { dbConnect };