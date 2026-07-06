import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

export interface AuthedRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticate = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({ message: 'Server misconfiguration' });
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};
