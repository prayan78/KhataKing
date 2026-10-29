import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

let isConnected = false;
let useMemoryStore = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khataking';
  const isCloudUri = uri.includes('mongodb+srv') || uri.includes('mongodb.net');
  const timeoutMs = isCloudUri ? 10000 : 2500;

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
    });
    isConnected = true;
    useMemoryStore = false;
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return true;
  } catch (err) {
    console.warn(`⚠️ MongoDB connection unavailable (${err.message}). Activating KhataKing Embedded Auto-Persistent Store.`);
    isConnected = false;
    useMemoryStore = true;
    return false;
  }
};

export const getDBStatus = () => ({
  isConnected,
  useMemoryStore,
});

