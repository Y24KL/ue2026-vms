import { Router, Request, Response } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import fs from 'fs';

const router = Router();

// Automatically create the uploads folder if it doesn't exist yet
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Better storage configuration to keep original file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post('/setup', upload.single('passportPhoto'), async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token found' });
    }

    const token = authHeader.split(' ')[1];
    
    // Standardized fallback secret to match authController
    const jwtSecret = process.env.JWT_SECRET || 'supersecretvmskey2026';

    // 🔥 THE CRITICAL FIX: Verify and decode the token payload first!
    const decoded = jwt.verify(token, jwtSecret) as any;

    // 💡 DEFENSIVE FIX: Check both common token styles (userId or id)
    const targetUserId = decoded.userId || decoded.id;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Invalid token payload: User ID missing' });
    }

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

export default router;