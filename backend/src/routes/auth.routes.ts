import { Router } from 'express';
import { register, login, verifyOtpController, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtpController);
router.post('/logout', requireAuth, logout);

export default router;