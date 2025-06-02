// tests/tradeController.test.ts
import { Request, Response } from 'express';
import * as tradeController from '../src/controllers/tradeController';
import { Trade } from '../src/models/Trade';
import { User } from '../src/models/User';
import * as notificationService from '../src/services/notificationService';

jest.mock('../src/models/Trade');
jest.mock('../src/models/User');
jest.mock('../src/services/notificationService');

describe('tradeController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    req = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('createTradeRequest', () => {
    it('should create a trade successfully', async () => {
      req = {
        body: {
          responderId: 'responderId',
          requesterPokemon: [{ id: 1, name: 'Pikachu', level: 10, rarity: 'common' }],
          responderPokemon: [{ id: 2, name: 'Bulbasaur', level: 12, rarity: 'uncommon' }],
        },
        user: { userId: 'requesterId' },
      };

      // Mock validateTrade to return true
      jest.spyOn(require('../src/services/validateService'), 'validateTrade').mockReturnValue(true);
      // Mock Trade.create
      (Trade.create as jest.Mock).mockResolvedValue({ id: 'tradeId' });

      await tradeController.createTradeRequest(req as Request, res as Response);

      expect(Trade.create).toHaveBeenCalledWith({
        requesterId: 'requesterId',
        responderId: 'responderId',
        requesterPokemon: req.body.requesterPokemon,
        responderPokemon: req.body.responderPokemon,
        status: 'pending',
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ id: 'tradeId' });
    });

    it('should return 400 if trade is invalid', async () => {
      req = {
        body: {
          responderId: 'responderId',
          requesterPokemon: [],
          responderPokemon: [],
        },
        user: { userId: 'requesterId' },
      };
      jest.spyOn(require('../src/services/validateService'), 'validateTrade').mockReturnValue(false);

      await tradeController.createTradeRequest(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Trade is not valid based on game rules' });
    });

    it('should return 500 on error', async () => {
      req = {
        body: {
          responderId: 'responderId',
          requesterPokemon: [],
          responderPokemon: [],
        },
        user: { userId: 'requesterId' },
      };
      jest.spyOn(require('../src/services/validateService'), 'validateTrade').mockImplementation(() => {
        throw new Error('fail');
      });

      await tradeController.createTradeRequest(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to create trade request' });
    });
  });

  describe('acceptTrade', () => {
    it('should accept a valid trade and notify users', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };

      const mockTrade = {
        id: 'tradeId',
        responderId: 'responderId',
        requesterId: 'requesterId',
        status: 'pending',
        requesterPokemon: [{ id: 1, name: 'Pikachu', level: 10, rarity: 'common' }],
        responderPokemon: [{ id: 2, name: 'Bulbasaur', level: 12, rarity: 'uncommon' }],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockRequester = {
        id: 'requesterId',
        email: 'req@example.com',
        pokemon: [{ id: 1, name: 'Pikachu', level: 10, rarity: 'common' }],
        tradeCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockResponder = {
        id: 'responderId',
        email: 'res@example.com',
        pokemon: [{ id: 2, name: 'Bulbasaur', level: 12, rarity: 'uncommon' }],
        tradeCount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      (Trade.findById as jest.Mock).mockResolvedValue(mockTrade);
      (User.findById as jest.Mock)
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockResponder);

      (notificationService.notifyUser as jest.Mock).mockResolvedValue(undefined);

      await tradeController.acceptTrade(req as Request, res as Response);

      expect(mockTrade.status).toBe('accepted');
      expect(mockRequester.pokemon.length).toBeGreaterThan(0);
      expect(mockResponder.pokemon.length).toBeGreaterThan(0);
      expect(mockRequester.tradeCount).toBe(1);
      expect(mockResponder.tradeCount).toBe(1);
      expect(mockTrade.save).toHaveBeenCalled();
      expect(mockRequester.save).toHaveBeenCalled();
      expect(mockResponder.save).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalledTimes(2);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Trade accepted and Pokémon ownership transferred' });
    });

    it('should return 404 if trade not found', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };
      (Trade.findById as jest.Mock).mockResolvedValue(null);

      await tradeController.acceptTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Trade not found' });
    });

    it('should return 403 if user unauthorized', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'someOtherUser' },
      };

      (Trade.findById as jest.Mock).mockResolvedValue({
        responderId: 'responderId',
        status: 'pending',
      });

      await tradeController.acceptTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Not authorized to accept this trade' });
    });

    it('should return 400 if trade already processed', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };

      (Trade.findById as jest.Mock).mockResolvedValue({
        responderId: 'responderId',
        status: 'accepted',
      });

      await tradeController.acceptTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Trade already processed' });
    });

    it('should return 500 on error', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };
      (Trade.findById as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });

      await tradeController.acceptTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to accept trade' });
    });
  });

  describe('rejectTrade', () => {
    it('should reject a valid trade and notify users', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };

      const mockTrade = {
        id: 'tradeId',
        responderId: 'responderId',
        requesterId: 'requesterId',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockRequester = {
        id: 'requesterId',
        email: 'req@example.com',
      };

      const mockResponder = {
        id: 'responderId',
        email: 'res@example.com',
      };

      (Trade.findById as jest.Mock).mockResolvedValue(mockTrade);
      (User.findById as jest.Mock)
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockResponder);

      (notificationService.notifyUser as jest.Mock).mockResolvedValue(undefined);

      await tradeController.rejectTrade(req as Request, res as Response);

      expect(mockTrade.status).toBe('rejected');
      expect(mockTrade.save).toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalledTimes(2);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Trade rejected' });
    });

    it('should return 404 if trade not found', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };
      (Trade.findById as jest.Mock).mockResolvedValue(null);

      await tradeController.rejectTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Trade not found' });
    });

    it('should return 403 if unauthorized', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'someOtherUser' },
      };

      (Trade.findById as jest.Mock).mockResolvedValue({
        responderId: 'responderId',
        status: 'pending',
      });

      await tradeController.rejectTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Not authorized to reject this trade' });
    });

    it('should return 400 if already processed', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };

      (Trade.findById as jest.Mock).mockResolvedValue({
        responderId: 'responderId',
        status: 'accepted',
      });

      await tradeController.rejectTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Trade already processed' });
    });

    it('should return 500 on error', async () => {
      req = {
        params: { id: 'tradeId' },
        user: { userId: 'responderId' },
      };
      (Trade.findById as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });

      await tradeController.rejectTrade(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to reject trade' });
    });
  });
});
