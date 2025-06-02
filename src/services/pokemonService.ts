import { fetchRandomPokemon } from '../utils/fetchPokemon';
import { User } from '../models/User';
import { config } from '../config/env';

export const assignStarterPokemon = async (userId: string) => {
  const pokemon = await fetchRandomPokemon(config.initialPokemonCount);
  await User.findByIdAndUpdate(userId, { $set: { pokemon } });

};