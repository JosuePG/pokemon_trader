import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/env';
import { createClient } from 'redis';
import { connectRabbitMQ } from './config/rabbitmq';
import authRoutes from './routes/authRoutes';
import tradeRoutes from './routes/tradeRoutes';
import pokemonRoutes from './routes/pokemonRoutes';
import { startTradeWorker } from './queues/tradeWorker';
import rankingRoutes from './routes/rankingRoutes';

const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/rankings', rankingRoutes);

// DB Connection
mongoose.connect(config.mongoUri).then(() => {
  console.log('MongoDB connected');

  // Redis connection
  const redis = createClient({ url: config.redisUrl });
  redis.connect().then(() => console.log('Redis connected'));

  // RabbitMQ connection
  connectRabbitMQ().then(() => console.log('RabbitMQ connected'));

  // Start server
  app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
});

startTradeWorker();
