import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env reliably from server folder or root
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import { connectDB, getDBStatus } from './config/db.js';
import apiRoutes from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploaded scan images and brand assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve built frontend assets
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Health check endpoint (placed before catch-all)
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'ok',
    app: 'KhataKing API',
    timezone: 'Asia/Kathmandu',
    time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }),
    database: dbStatus.isConnected ? 'MongoDB Atlas (Connected)' : 'Embedded Auto-Persistent Store (Active)',
    isConnected: dbStatus.isConnected
  });
});

// API Routes
app.use('/api', apiRoutes);

// Catch-all for SPA navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('KhataKing API Server is running. Please build client or run npm run client.');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'आन्तरिक सर्भर त्रुटि (Internal Server Error)'
  });
});

// Connect DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 KhataKing Server running on http://localhost:${PORT}`);
  });
});
