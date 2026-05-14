import { Router } from 'express';
import {
    register,
    login,
    verifyOtpController,
    logout,
    resendOtpController,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtpController);
router.post('/logout', requireAuth, logout);
router.post('/resend-otp', resendOtpController);

export default router;