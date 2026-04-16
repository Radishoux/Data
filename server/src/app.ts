/**
 * Hono app factory — exported for use in both the server entry point and tests.
 * The WebSocket upgrade is handled separately in src/index.ts since it requires
 * Bun-specific APIs not available in the test environment.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import questionsRouter from './routes/questions.js';
import answersRouter from './routes/answers.js';
import friendsRouter from './routes/friends.js';
import messagesRouter from './routes/messages.js';

export const app = new Hono();

app.use('*', cors());

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/questions', questionsRouter);
app.route('/api/answers', answersRouter);
app.route('/api/friends', friendsRouter);
app.route('/api/messages', messagesRouter);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
