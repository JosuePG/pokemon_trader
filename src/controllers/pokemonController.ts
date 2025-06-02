import { Request, Response } from 'express';
import { User } from '../models/User';
import redis from '../config/redisClient';

export const getMyPokemons = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  console.log('Fetching Pokémon for user:', userId);
  try {
    const user = await User.findById(userId).select('pokemon');
    console.log('User found:', user);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.pokemon);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve Pokémon' });
  }
};

export const getUserPokemon = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const cacheKey = `user:pokemon:${userId}`;

    // Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Otherwise, query DB
    const user = await User.findById(userId).select('pokemon');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Cache result
    await redis.set(cacheKey, JSON.stringify(user.pokemon), 'EX', 60 * 5); // cache for 5 minutes

    return res.status(200).json(user.pokemon);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch Pokémon' });
  }
};