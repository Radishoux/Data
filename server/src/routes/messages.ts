import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { Message } from '../models/Message.js';
import { Friend } from '../models/Friend.js';
import type { HonoEnv } from '../types.js';
import mongoose from 'mongoose';

const messagesRouter = new Hono<HonoEnv>();

messagesRouter.use('*', authMiddleware);

const postMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1),
});

// GET /api/messages/:friendId — message history (last 100, sorted asc)
messagesRouter.get('/:friendId', async (c) => {
  try {
    const userId = c.get('userId');
    const friendId = c.req.param('friendId');

    // Verify friendship
    const friendship = await Friend.findOne({
      $or: [
        {
          requesterId: new mongoose.Types.ObjectId(userId),
          receiverId: new mongoose.Types.ObjectId(friendId),
          status: 'accepted',
        },
        {
          requesterId: new mongoose.Types.ObjectId(friendId),
          receiverId: new mongoose.Types.ObjectId(userId),
          status: 'accepted',
        },
      ],
    });

    if (!friendship) {
      return c.json({ error: 'Forbidden: not friends with this user' }, 403);
    }

    const messages = await Message.find({
      $or: [
        {
          senderId: new mongoose.Types.ObjectId(userId),
          receiverId: new mongoose.Types.ObjectId(friendId),
        },
        {
          senderId: new mongoose.Types.ObjectId(friendId),
          receiverId: new mongoose.Types.ObjectId(userId),
        },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    return c.json({ messages: messages.map((m) => m.toJSON()) });
  } catch (err) {
    console.error('[messages/:friendId GET]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/messages
messagesRouter.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const parsed = postMessageSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { receiverId, content } = parsed.data;

    // Verify friendship
    const friendship = await Friend.findOne({
      $or: [
        {
          requesterId: new mongoose.Types.ObjectId(userId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
          status: 'accepted',
        },
        {
          requesterId: new mongoose.Types.ObjectId(receiverId),
          receiverId: new mongoose.Types.ObjectId(userId),
          status: 'accepted',
        },
      ],
    });

    if (!friendship) {
      return c.json({ error: 'Forbidden: not friends with this user' }, 403);
    }

    const message = await Message.create({
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content,
    });

    return c.json({ message: message.toJSON() }, 201);
  } catch (err) {
    console.error('[messages POST]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default messagesRouter;
