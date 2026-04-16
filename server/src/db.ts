import mongoose from 'mongoose';
import { config } from './config.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDB(): Promise<void> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(config.mongoUri);
      console.log('[DB] Connected to MongoDB');
      return;
    } catch (err) {
      attempt++;
      console.error(`[DB] Connection attempt ${attempt} failed:`, err);
      if (attempt < MAX_RETRIES) {
        console.log(`[DB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(`[DB] Failed to connect after ${MAX_RETRIES} attempts`);
}
