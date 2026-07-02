// backend/src/routes/adminRoutes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.put('/volunteers/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await prisma.user.update({
    where: { id },
    data: { status }
  });
  res.json(updated);
});

router.post('/attendance/scan', async (req, res) => {
  const { qrCode } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { qrCode } });

    if (!user) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const existing = await prisma.attendance.findUnique({ where: { userId: user.id } });

    if (existing) {
      return res.status(409).json({ message: 'Already checked in', fullName: user.fullName });
    }

    await prisma.attendance.create({
      data: { userId: user.id }
    });

    return res.status(200).json({ fullName: user.fullName });
  } catch (error) {
    console.error('❌ ATTENDANCE SCAN CRASH:', error);
    return res.status(500).json({ message: 'Internal server error during scan' });
  }
});

export default router;