import mongoose from 'mongoose';

declare global {
  var __mongoose: Promise<typeof mongoose> | undefined;
}

export function dbConnect() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!global.__mongoose) {
    global.__mongoose = mongoose.connect(uri, { dbName: 'lexora' });
  }

  return global.__mongoose;
}
