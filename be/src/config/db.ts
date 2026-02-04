// MongoDB (Mongoose) setup
import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

if (!mongoUri) {
  console.warn('⚠️  MONGO_URI not set. The app will attempt to run without a MongoDB connection. For production, set MONGO_URI to your MongoDB connection string.');
}

export const connectMongo = async () => {
  if (!mongoUri) return;
  try {
    await mongoose.connect(mongoUri, {
      // Recommended options
      // useNewUrlParser and useUnifiedTopology are defaults in modern mongoose
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);
    throw err;
  }
};

/**
 * Simple counter collection for generating sequential numeric IDs (legacy-friendly)
 */
export const getNextSequence = async (name: string): Promise<number> => {
  const Counter = mongoose.models.Counter || mongoose.model('Counter', new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }), 'counters');
  const doc = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, new: true }).exec();
  return doc.seq;
};

export const closeDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
};