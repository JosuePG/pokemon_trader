import { User } from '../models/User';

export const getTopRankedUsers = async (limit = 10) => {
  return User.find().sort({ tradeCount: -1 }).limit(limit).select('email tradeCount');
};