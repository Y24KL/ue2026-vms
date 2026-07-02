import { Router } from 'express';
import { register, login, adminSignup } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin-signup', adminSignup);

export default router;
