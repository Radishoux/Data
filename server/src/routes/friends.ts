import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { Friend } from '../models/Friend.js';
import { User } from '../models/User.js';
import type { HonoEnv } from '../types.js';
import mongoose from 'mongoose';

const friendsRouter = new Hono<HonoEnv>();

friendsRouter.use('*', authMiddleware);

const requestSchema = z.object({
  identifier: z.string().min(1),
});

// GET /api/friends — list accepted friends with user data
friendsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const friendships = await Friend.find({
      $or: [
        { requesterId: userObjectId, status: 'accepted' },
        { receiverId: userObjectId, status: 'accepted' },
      ],
    });

    const friendIds = friendships.map((f) => {
      return f.requesterId.toString() === userId
        ? f.receiverId
        : f.requesterId;
    });

    const friendUsers = await User.find({ _id: { $in: friendIds } });

    return c.json({
      friends: friendships.map((f) => {
        const friendId =
          f.requesterId.toString() === userId
            ? f.receiverId.toString()
            : f.requesterId.toString();
        const friendUser = friendUsers.find((u) => u._id.toString() === friendId);
        return {
          friendship: f.toJSON(),
          user: friendUser ? friendUser.toJSON() : null,
        };
      }),
    });
  } catch (err) {
    console.error('[friends GET]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/friends/request — send friend request by email or nickname
friendsRouter.post('/request', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { identifier } = parsed.data;

    // Find target user by email or nickname
    const targetUser = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { nickname: identifier }],
    });

    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (targetUser._id.toString() === userId) {
      return c.json({ error: 'Cannot send friend request to yourself' }, 400);
    }

    // Check if request already exists
    const existing = await Friend.findOne({
      $or: [
        { requesterId: new mongoose.Types.ObjectId(userId), receiverId: targetUser._id },
        { requesterId: targetUser._id, receiverId: new mongoose.Types.ObjectId(userId) },
      ],
    });

    if (existing) {
      return c.json({ error: 'Friend request already exists or already friends' }, 400);
    }

    const friendship = await Friend.create({
      requesterId: new mongoose.Types.ObjectId(userId),
      receiverId: targetUser._id,
      status: 'pending',
    });

    return c.json({ friendship: friendship.toJSON() }, 201);
  } catch (err) {
    console.error('[friends/request POST]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/friends/requests — incoming pending requests
friendsRouter.get('/requests', async (c) => {
  try {
    const userId = c.get('userId');

    const requests = await Friend.find({
      receiverId: new mongoose.Types.ObjectId(userId),
      status: 'pending',
    });

    // Populate requester info
    const requesterIds = requests.map((r) => r.requesterId);
    const requesters = await User.find({ _id: { $in: requesterIds } });

    const result = requests.map((r) => {
      const requester = requesters.find(
        (u) => u._id.toString() === r.requesterId.toString()
      );
      return {
        request: r.toJSON(),
        from: requester ? requester.toJSON() : null,
      };
    });

    return c.json({ requests: result });
  } catch (err) {
    console.error('[friends/requests GET]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PATCH /api/friends/:requestId/accept
friendsRouter.patch('/:requestId/accept', async (c) => {
  try {
    const userId = c.get('userId');
    const requestId = c.req.param('requestId');

    const friendship = await Friend.findById(requestId);
    if (!friendship) {
      return c.json({ error: 'Friend request not found' }, 404);
    }

    if (friendship.receiverId.toString() !== userId) {
      return c.json({ error: 'Forbidden: not the receiver of this request' }, 403);
    }

    if (friendship.status !== 'pending') {
      return c.json({ error: 'Request is not pending' }, 400);
    }

    friendship.status = 'accepted';
    await friendship.save();

    return c.json({ friendship: friendship.toJSON() });
  } catch (err) {
    console.error('[friends/:requestId/accept PATCH]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /api/friends/:friendId
friendsRouter.delete('/:friendId', async (c) => {
  try {
    const userId = c.get('userId');
    const friendId = c.req.param('friendId');

    const result = await Friend.deleteOne({
      $or: [
        {
          requesterId: new mongoose.Types.ObjectId(userId),
          receiverId: new mongoose.Types.ObjectId(friendId),
        },
        {
          requesterId: new mongoose.Types.ObjectId(friendId),
          receiverId: new mongoose.Types.ObjectId(userId),
        },
      ],
    });

    if (result.deletedCount === 0) {
      return c.json({ error: 'Friend relationship not found' }, 404);
    }

    return c.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error('[friends/:friendId DELETE]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default friendsRouter;
