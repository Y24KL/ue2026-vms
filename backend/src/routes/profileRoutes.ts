import { Router, Response } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import path from 'path';
import { prisma } from '../server';
import fs from 'fs';
import { authenticate, AuthedRequest } from '../middleware/auth';

const router = Router();

// Automatically create the uploads folder if it doesn't exist yet
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Storage configuration: keep the original extension but never trust the
// client-supplied filename itself (path traversal via originalname).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
    cb(null, uniqueSuffix + safeExt);
  }
});

const upload = multer({ storage });

router.post('/setup', authenticate, upload.single('passportPhoto'), async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const targetUserId = req.user!.id;

    const { fullName, phoneNumber, unilagStatus, department } = req.body;
    
    // Normalize file paths for Windows systems
    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        fullName, 
        phoneNumber, 
        unilagStatus, 
        department, 
        passportPhoto: imagePath, 
        status: 'VERIFIED' 
      }
    });

    return res.status(200).json({ 
      message: 'Profile setup complete', 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        department: updatedUser.department,
        status: updatedUser.status // Added status field for seamless routing
      } 
    });

  } catch (error) {
    // THIS WILL NOW PRINT THE EXACT ERROR IN YOUR BACKEND TERMINAL IF IT FAILS
    console.error("❌ PROFILE SETUP CRASH LOG:", error);
    return res.status(500).json({ message: 'Internal server error during profile setup' });
  }
});

// Issues a short-lived signed token binding this user's id, so the QR badge
// can't just be recreated by anyone who knows/guesses a user's UUID.
router.get('/qr-token', authenticate, async (req: AuthedRequest, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.status !== 'VERIFIED') {
      return res.status(403).json({ message: 'Profile is not verified yet' });
    }

    const qrToken = jwt.sign(
      { sub: user.id, purpose: 'attendance-qr' },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    return res.status(200).json({ qrToken });
  } catch (error) {
    console.error('QR token issuance failed:', error);
    return res.status(500).json({ message: 'Internal server error while issuing QR token' });
  }
});

export default router;
