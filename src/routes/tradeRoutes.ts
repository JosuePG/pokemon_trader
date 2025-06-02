import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createTradeRequest,showTrades } from '../controllers/tradeController';
import { acceptTrade, rejectTrade } from '../controllers/tradeController';

const router = Router();

router.get('/', authenticate, showTrades);
router.post('/', authenticate, createTradeRequest);
router.post('/:id/accept', authenticate, acceptTrade);
router.post('/:id/reject', authenticate, rejectTrade);

export default router;