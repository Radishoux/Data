import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { Answer } from '../models/Answer.js';
import { Friend } from '../models/Friend.js';
import { User } from '../models/User.js';
import { questions } from '../data/questions.js';
import type { HonoEnv } from '../types.js';
import mongoose from 'mongoose';

const answersRouter = new Hono<HonoEnv>();

answersRouter.use('*', authMiddleware);

const postAnswerSchema = z.object({
  questionId: z.string().min(1),
  content: z.string().min(1),
});

function getDayOfYear(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - jan1.getTime()) / 86400000);
}

function getTodayQuestionId(): string {
  const now = new Date();
  const dayOfYear = getDayOfYear(now);
  const index = dayOfYear % questions.length;
  return questions[index]?.id ?? questions[0]!.id;
}

// GET /api/answers/friends/today — today's answers from accepted friends
answersRouter.get('/friends/today', async (c) => {
  try {
    const userId = c.get('userId');
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const todayQId = getTodayQuestionId();

    // Find all accepted friendships
    const friendships = await Friend.find({
      $or: [
        { requesterId: userObjectId, status: 'accepted' },
        { receiverId: userObjectId, status: 'accepted' },
      ],
    });

    if (friendships.length === 0) {
      return c.json({ questionId: todayQId, answers: [] });
    }

    const friendIds = friendships.map((f) =>
      f.requesterId.toString() === userId ? f.receiverId : f.requesterId
    );

    // Find their answers for today's question
    const answers = await Answer.find({
      questionId: todayQId,
      userId: { $in: friendIds },
    });

    if (answers.length === 0) {
      return c.json({ questionId: todayQId, answers: [] });
    }

    // Populate user info for each answer
    const answerUserIds = answers.map((a) => a.userId);
    const users = await User.find({ _id: { $in: answerUserIds } });
    const userMap = new Map(users.map((u) => [u._id.toString(), u.toJSON()]));

    return c.json({
      questionId: todayQId,
      answers: answers.map((a) => ({
        answer: a.toJSON(),
        user: userMap.get(a.userId.toString()) ?? null,
      })),
    });
  } catch (err) {
    console.error('[answers/friends/today]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/answers/me
answersRouter.get('/me', async (c) => {
  try {
    const userId = c.get('userId');

    const answers = await Answer.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ answeredAt: -1 });

    return c.json({ answers: answers.map((a) => a.toJSON()) });
  } catch (err) {
    console.error('[answers/me]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/answers
answersRouter.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const parsed = postAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { questionId, content } = parsed.data;

    // Check if this is today's question — prevent duplicate answers
    const todayQuestionId = getTodayQuestionId();
    if (questionId === todayQuestionId) {
      const existing = await Answer.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        questionId,
      });
      if (existing) {
        return c.json({ error: "You have already answered today's question" }, 400);
      }
    }

    const answer = await Answer.create({
      userId: new mongoose.Types.ObjectId(userId),
      questionId,
      content,
    });

    return c.json({ answer: answer.toJSON() }, 201);
  } catch (err: unknown) {
    // Handle MongoDB duplicate key error
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: unknown }).code === 11000
    ) {
      return c.json({ error: 'You have already answered this question' }, 400);
    }
    console.error('[answers POST]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/answers/user/:userId
answersRouter.get('/user/:userId', async (c) => {
  try {
    const currentUserId = c.get('userId');
    const targetUserId = c.req.param('userId');

    // Verify friendship
    const friendship = await Friend.findOne({
      $or: [
        {
          requesterId: new mongoose.Types.ObjectId(currentUserId),
          receiverId: new mongoose.Types.ObjectId(targetUserId),
          status: 'accepted',
        },
        {
          requesterId: new mongoose.Types.ObjectId(targetUserId),
          receiverId: new mongoose.Types.ObjectId(currentUserId),
          status: 'accepted',
        },
      ],
    });

    if (!friendship) {
      return c.json({ error: 'Forbidden: not friends with this user' }, 403);
    }

    const answers = await Answer.find({
      userId: new mongoose.Types.ObjectId(targetUserId),
    }).sort({ answeredAt: -1 });

    return c.json({ answers: answers.map((a) => a.toJSON()) });
  } catch (err) {
    console.error('[answers/user/:userId]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default answersRouter;
