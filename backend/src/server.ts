import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// 1. Import all the routes
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import profileRoutes from './routes/profileRoutes';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// 2. Configure CORS to accept credentials and token headers
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 3. Serve the uploads directory so your frontend can display the passport photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4. API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Server Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'VMS Core Engine' });
});

app.listen(PORT, () => {
  console.log(`📡 VMS Core Engine running on port ${PORT}`);
});