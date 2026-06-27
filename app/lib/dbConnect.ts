import mongoose, { type Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acadmy';

if (!MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is not defined');
}

// 1. گلوبل انٹرفیس کی وضاحت
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

// 2. محفوظ طریقے سے کیشے کو ڈیفائن کریں
let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<Mongoose> {
  // اگر کنکشن پہلے سے موجود ہے
  if (cached.conn) {
    return cached.conn;
  }

  // اگر پراسس چل رہا ہے
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      autoIndex: false, // یہ لائن آپ کے "language override" ایرر کو حل کرے گی
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('✅ MongoDB Connected!');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;