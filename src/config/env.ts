import * as dotenv from 'dotenv';
dotenv.config();
export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI!,
  redisUrl: process.env.REDIS_URL!,
  rabbitMqUrl: process.env.RABBITMQ_URL!,
  initialPokemonCount: Number(process.env.INITIAL_POKEMON_COUNT) || 3,
  jwtSecret: process.env.JWT_SECRET!,
  emailNotifications: process.env.EMAIL_NOTIFICATIONS === 'true'
};