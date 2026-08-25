import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is not configured');
const uri: string = mongoUri;

declare global { var __mongoose: Promise<typeof mongoose> | undefined }

export function dbConnect() {
  if (!global.__mongoose) {
    global.__mongoose = mongoose.connect(uri, { dbName: 'lexora' });
  }
  return global.__mongoose;
}
