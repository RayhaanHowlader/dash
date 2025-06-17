import mongoose from 'mongoose';

// Define the type for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare the global mongoose property
declare global {
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
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 3,
      minPoolSize: 1,
      maxIdleTimeMS: 60000,
      heartbeatFrequencyMS: 5000,
      retryWrites: true,
      retryReads: true,
      w: 1 as const,
      wtimeoutMS: 5000,
      family: 4,
      monitorCommands: true,
      maxConnecting: 2,
      waitQueueTimeoutMS: 30000,
      compressors: ['zlib' as const],
      zlibCompressionLevel: 6 as const,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        // Add connection event handlers
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
          cached.conn = null;
          cached.promise = null;
        });

        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
          cached.conn = null;
          cached.promise = null;
        });

        mongoose.connection.on('reconnected', () => {
          console.log('MongoDB reconnected');
        });

        // Monitor connection state
        mongoose.connection.on('connected', () => {
          console.log('MongoDB connected');
        });

        mongoose.connection.on('connecting', () => {
          console.log('MongoDB connecting...');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
          try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
          } catch (err) {
            console.error('Error during MongoDB disconnection:', err);
            process.exit(1);
          }
        });

        return mongoose;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('MongoDB connection error:', error);
        throw error;
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