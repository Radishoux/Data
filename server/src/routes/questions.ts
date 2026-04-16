import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { questions } from '../data/questions.js';
import type { HonoEnv } from '../types.js';

const questionsRouter = new Hono<HonoEnv>();

questionsRouter.use('*', authMiddleware);

function getDayOfYear(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - jan1.getTime()) / 86400000);
}

// GET /api/questions/today
questionsRouter.get('/today', async (c) => {
  try {
    const now = new Date();
    const dayOfYear = getDayOfYear(now);
    const index = dayOfYear % questions.length;
    const question = questions[index];

    return c.json({
      question,
      date: now.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('[questions/today]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/questions
questionsRouter.get('/', async (c) => {
  try {
    return c.json({ questions });
  } catch (err) {
    console.error('[questions]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default questionsRouter;
