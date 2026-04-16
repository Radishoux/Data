import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import type { HonoEnv } from '../types.js';

interface JwtPayload {
  userId: string;
}

export async function authMiddleware(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: missing or malformed token' }, 401);
  }

  const token = authHeader.slice(7);

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return c.json({ error: 'Unauthorized: invalid or expired token' }, 401);
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return c.json({ error: 'Unauthorized: user not found' }, 401);
  }

  c.set('userId', user._id.toString());
  c.set('user', user);

  await next();
}
