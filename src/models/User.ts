import mongoose, { Schema, Document } from 'mongoose';

export interface IPokemon {
  pokeId?: number;
  name?: string;
  level?: number;
  rarity?: string;
}

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  pokemon: IPokemon[];
  tradeCount: number;
}

const userSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  pokemon: [
    {
      pokeId: Number,
      name: String,
      level: Number,
      sprite: String,
    },
  ],
  tradeCount: { type: Number, default: 0 },
  successfulTrades: { type: Number, default: 0 }
});

export const User = mongoose.model<IUser>('User', userSchema);