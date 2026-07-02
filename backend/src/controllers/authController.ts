// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const VALID_DEPARTMENTS = ['USHER', 'VENUE_MANAGER', 'PROTOCOL', 'WELFARE', 'CHOIR'];

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, fullName }
    });

    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Register failed:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

export const adminSignup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, department, role } = req.body;

    if (!email || !password || !fullName || !department) {
      return res.status(400).json({ message: 'Email, password, full name, and unit are required.' });
    }

    if (!VALID_DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: 'Invalid operational unit selected.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'UNIT_HEAD';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        department,
        role: assignedRole,
        status: 'VERIFIED'
      }
    });

    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Admin signup failed:', err);
    res.status(500).json({ message: 'Server error during admin signup.' });
  }
};