import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterPokemon: [{ pokeId: Number, name: String, sprite: String, level: Number }],
  responderPokemon: [{ pokeId: Number, name: String, sprite: String, level: Number }],
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export const Trade = mongoose.model('Trade', tradeSchema);
