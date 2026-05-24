import { Router } from 'express';
import { postChat } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, postChat);

export default router;