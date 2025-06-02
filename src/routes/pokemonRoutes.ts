import { Router } from 'express';
import { getMyPokemons } from '../controllers/pokemonController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/mine', authenticate, getMyPokemons);

export default router;