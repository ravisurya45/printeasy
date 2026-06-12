import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  prices: {
    bw: { type: Number, default: 2 },
    color: { type: Number, default: 10 },
    singleSide: { type: Number, default: 0 },
    doubleSide: { type: Number, default: 0 },
    soft: { type: Number, default: 20 },
    spiral: { type: Number, default: 40 },
    hard: { type: Number, default: 150 },
    delivery: { type: Number, default: 50 },
  }
});

export default mongoose.model('Settings', settingsSchema);
