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

export default router;
