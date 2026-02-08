import mongoose from 'mongoose';
import '@/models/User';
import '@/models/GoldDetail';
import '@/models/Loan';
import '@/models/CompletedLoan';
import '@/models/Payment';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is missing in production environment variables');
    }
    // For local development, fallback but warn
    console.warn('MONGODB_URI missing, falling back to localhost');
}

const connectionString = MONGODB_URI || 'mongodb://localhost:27017/gold';

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached?.conn) {
        return cached.conn;
    }

    if (!cached?.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached!.promise = mongoose.connect(connectionString, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        throw e;
    }

    return cached!.conn;
}

export default dbConnect;
