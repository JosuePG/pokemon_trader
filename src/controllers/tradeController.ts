import { Request, Response } from 'express';
import { Trade } from '../models/Trade';
import { User, IUser } from '../models/User';
import { validateTrade } from '../services/validateService';
import { notifyUser } from '../services/notificationService';
import redis from '../config/redisClient';



export const showTrades = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const trades = await Trade.find({
      $or: [{ requesterId: userId }, { responderId: userId }],
    })
      .populate('requesterId', 'email tradeCount')
      .populate('responderId', 'email tradeCount')
      .sort({ createdAt: -1 });

    res.json(trades);
  } catch (err) {
    console.log('error fetching trades:', err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
};

export const createTradeRequest = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { responderId, requesterPokemon, responderPokemon } = req.body;

  try {
    const isValid = validateTrade(requesterPokemon, responderPokemon);
    if (!isValid) {
      return res.status(400).json({ error: 'Trade is not valid based on game rules' });
    }
    
    const trade = await Trade.create({
      requesterId: userId,
      responderId,
      requesterPokemon,
      responderPokemon,
      status: 'pending',
    });

    res.status(201).json(trade);
  } catch (err) {
    console.log('error creating trade:', err);
    res.status(500).json({ error: 'Failed to create trade request' });
  }
};

export const acceptTrade = async (req: Request, res: Response) => {
  //get user data
  const userId = (req as any).user.userId;
  const tradeId = req.params.id;

  try {
    //find the trade
    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.responderId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to accept this trade' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade already processed' });
    }
    //get the requester and responder users
    const requester = await User.findById(trade.requesterId) as IUser;
    const responder = await User.findById(trade.responderId) as IUser;
    if (!requester || !responder) return res.status(400).json({ error: 'Invalid users' });

    const toGiveIds = trade.requesterPokemon.map(p => p.id);
    const toReceiveIds = trade.responderPokemon.map(p => p.id);

    requester.pokemon = requester.pokemon.filter(p => !toGiveIds.includes(p.id));
    responder.pokemon = responder.pokemon.filter(p => !toReceiveIds.includes(p.id));
    //update the users' pokemon arrays
    requester.pokemon.push(
      ...trade.responderPokemon.map(p => ({
        pokeId: p.id,
        name: p.name,
        level: p.level
      }))
    );
    responder.pokemon.push(
      ...trade.requesterPokemon.map(p => ({
        pokeId: p.id,
        name: p.name,
        level: p.level
      }))
    );

    trade.status = 'accepted';
    requester.tradeCount = (requester.tradeCount || 0) + 1;
    responder.tradeCount = (responder.tradeCount || 0) + 1;

    await Promise.all([trade.save(), requester.save(), responder.save()]);

    await redis.del(`user:pokemon:${requester.id}`);
    await redis.del(`user:pokemon:${responder.id}`);

    await notifyUser(requester.id, `Your trade with ${responder.email} was accepted.`, requester.email);
    await notifyUser(responder.id, `You accepted a trade with ${requester.email}.`, responder.email);

    res.json({ message: 'Trade accepted and Pokémon ownership transferred' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept trade' });
  }
};

export const rejectTrade = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const tradeId = req.params.id;

  try {
    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.responderId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to reject this trade' });
    }
    if (trade.status !== 'pending') {
      return res.status(400).json({ error: 'Trade already processed' });
    }

    trade.status = 'rejected';
    await trade.save();

    const requester = await User.findById(trade.requesterId);
    const responder = await User.findById(trade.responderId);
    if (requester && responder) {
      await notifyUser(requester.id, `Your trade with ${responder.email} was rejected.`, requester.email);
      await notifyUser(responder.id, `You rejected a trade from ${requester.email}.`, responder.email);
    }

    res.json({ message: 'Trade rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject trade' });
  }
};
