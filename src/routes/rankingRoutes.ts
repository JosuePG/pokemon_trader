import express from 'express';
import { getRanking } from '../controllers/rankingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/ranking - Get the leaderboard
router.get('/', authenticate, getRanking);

export default router;