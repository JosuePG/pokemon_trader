export const validateTrade = (requesterPokemon: any[], responderPokemon: any[]) => {
  if (!requesterPokemon.length || !responderPokemon.length) return false;

  const requesterLevelSum = requesterPokemon.reduce((sum, p) => sum + p.level, 0);
  const responderLevelSum = responderPokemon.reduce((sum, p) => sum + p.level, 0);

  const levelDifference = Math.abs(requesterLevelSum - responderLevelSum);
  if (levelDifference > 20) return false;

  return true;
};
