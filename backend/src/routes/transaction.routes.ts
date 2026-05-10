import { Router } from 'express';
import { getTransactions, postTransaction } from '../controllers/transaction.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getTransactions);
router.post('/', requireAuth, postTransaction);

export default router;