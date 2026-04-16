import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../models/User.js';
import type { HonoEnv } from '../types.js';
import mongoose from 'mongoose';

const users = new Hono<HonoEnv>();

users.use('*', authMiddleware);

const patchUserSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  avatarStyle: z.string().optional(),
});

// GET /api/users/me
users.get('/me', async (c) => {
  try {
    const user = c.get('user');
    return c.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[users/me GET]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PATCH /api/users/me
users.patch('/me', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.nickname !== undefined) updates['nickname'] = parsed.data.nickname;
    if (parsed.data.avatarStyle !== undefined) updates['avatarStyle'] = parsed.data.avatarStyle;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: updatedUser.toJSON() });
  } catch (err) {
    console.error('[users/me PATCH]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/users/:id — public user profile
users.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }
    const user = await User.findById(id);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[users/:id GET]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default users;
