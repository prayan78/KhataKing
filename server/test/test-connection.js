import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('Testing connection to MongoDB Atlas...');
console.log('Target URI:', uri ? uri.replace(/:[^:]*@/, ':****@') : 'UNDEFINED');

async function testConnection() {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`\n🎉 SUCCESS! MongoDB Connected successfully!`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Port: ${conn.connection.port}`);
    console.log(`Ready State: ${conn.connection.readyState} (1 = connected)`);
    
    // Check collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Existing collections (${collections.length}):`, collections.map(c => c.name));

    await mongoose.disconnect();
    console.log('Disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ FAILED TO CONNECT TO MONGODB:`, err.message);
    process.exit(1);
  }
}

testConnection();
