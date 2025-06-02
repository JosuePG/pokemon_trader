import { Request, Response } from 'express';
import {User} from '../models/User';

export const getRanking = async (req: Request, res: Response) => {
  try {
    // Sort users by successfulTrades in descending order
    const leaderboard = await User.find()
      .sort({ successfulTrades: -1 })
      .limit(100) // limit to top 100 users, adjust as needed
      .select('username successfulTrades') // only return necessary fields

    res.status(200).json({ leaderboard });
  } catch (err) {
    console.error('Failed to fetch rankings:', err);
    res.status(500).json({ message: 'Failed to load rankings' });
  }
};