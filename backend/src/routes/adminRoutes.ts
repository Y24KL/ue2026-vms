// backend/src/routes/adminRoutes.ts
import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const STAFF_ROLES = ['ADMIN', 'UNIT_HEAD'];

router.use(authenticate, requireRole(...STAFF_ROLES));

router.get('/volunteers', async (req, res) => {
  const volunteers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      unilagStatus: true,
      department: true,
      status: true,
      role: true
    }
  });
  res.json(volunteers);
});

router.put('/volunteers/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'VERIFIED' && status !== 'PENDING') {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status }
  });
  res.json(updated);
});

// Only an existing ADMIN can promote another account to ADMIN — the public
// signup endpoint always assigns UNIT_HEAD, so this is the only path to that role.
router.patch('/volunteers/:id/role', requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'ADMIN' && role !== 'UNIT_HEAD') {
    return res.status(400).json({ message: 'Invalid role value' });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role }
  });
  res.json(updated);
});

// In-memory store: no Announcement table exists yet in schema.prisma, and this
// repo's prisma/migrations history is already out of sync with the schema, so
// adding a migration blind (no reachable DB to verify) isn't safe here. This
// unblocks the frontend; move it to a real Prisma model once migrations are
// reconciled against a live database.
const announcements: { id: string; message: string; target: string; createdAt: string }[] = [];

router.get('/announcements', (req, res) => {
  res.json(announcements);
});

router.post('/announcements', (req, res) => {
  const { message, target } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'Announcement message is required.' });
  }

  const announcement = {
    id: Date.now().toString(),
    message,
    target: target || 'ALL',
    createdAt: new Date().toISOString()
  };
  announcements.unshift(announcement);
  res.status(201).json(announcement);
});

router.post('/attendance/scan', async (req, res) => {
  const { qrCode } = req.body;

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(qrCode, jwtSecret) as { sub: string; purpose: string };
      if (decoded.purpose !== 'attendance-qr' || !decoded.sub) {
        throw new Error('Wrong token purpose');
      }
      userId = decoded.sub;
    } catch {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const existing = await prisma.attendance.findUnique({ where: { userId: user.id } });

    if (existing) {
      return res.status(409).json({ message: 'Already checked in', fullName: user.fullName });
    }

    await prisma.attendance.create({
      data: { userId: user.id, scannedBy: (req as AuthedRequest).user?.id }
    });

    return res.status(200).json({ fullName: user.fullName });
  } catch (error) {
    console.error('❌ ATTENDANCE SCAN CRASH:', error);
    return res.status(500).json({ message: 'Internal server error during scan' });
  }
});

export default router;
