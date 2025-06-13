import mongoose from 'mongoose';

// Define the type for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare the global mongoose property
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Initialize cached with a default value if global.mongoose is undefined
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Update global.mongoose if it doesn't exist
if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToMongoDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    }).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    // Optional: log only once
    if (!process.env.SUPPRESS_MONGO_LOG) {
      console.log('MongoDB connected');
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}