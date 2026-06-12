import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  prices: {
    bwSingle: { type: Number, default: 2 },
    bwDouble: { type: Number, default: 3 },
    colorSingle: { type: Number, default: 10 },
    colorDouble: { type: Number, default: 18 },
    soft: { type: Number, default: 20 },
    spiral: { type: Number, default: 40 },
    hard: { type: Number, default: 150 },
    delivery: { type: Number, default: 50 },
  }
});

export default mongoose.model('Settings', settingsSchema);
