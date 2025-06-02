import axios from 'axios';

const MAX_POKEMON_ID = 898; // As of Gen 8

export const fetchRandomPokemon = async (count: number) => {
  const ids = new Set<number>();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * MAX_POKEMON_ID) + 1);
  }

  const requests = Array.from(ids).map((id) => axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`));
  const results = await Promise.all(requests);

  return results.map((res) => ({
    pokeId: res.data.id,
    name: res.data.name,
    sprite: res.data.sprites.front_default,
    level: Math.floor(Math.random() * 50) + 1 // Assign a random level 1–50
  }));
};