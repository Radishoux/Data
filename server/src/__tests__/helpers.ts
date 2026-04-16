import mongoose from 'mongoose';

export async function connectTestDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/data-test';
  await mongoose.connect(uri);
}

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
}

// Helper to create a test user and return user + JWT token
export async function createTestUser(overrides?: Partial<{ nickname: string; email: string; password: string }>) {
  const { User } = await import('../models/User.js');
  const bcrypt = await import('bcryptjs');
  const jwt = await import('jsonwebtoken');
  const { config } = await import('../config.js');

  const data = {
    nickname: overrides?.nickname ?? 'TestUser',
    email: overrides?.email ?? `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password: overrides?.password ?? 'password123',
  };

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({ nickname: data.nickname, email: data.email, passwordHash });
  const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as Parameters<typeof jwt.sign>[2]);

  return { user, token, password: data.password };
}

// Helper to create an accepted friendship between two users
export async function createFriendship(requesterId: string, receiverId: string) {
  const { Friend } = await import('../models/Friend.js');
  const mongoose = await import('mongoose');
  const friendship = await Friend.create({
    requesterId: new mongoose.default.Types.ObjectId(requesterId),
    receiverId: new mongoose.default.Types.ObjectId(receiverId),
    status: 'accepted',
  });
  return friendship;
}
