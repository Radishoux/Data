import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { User } from '../models/User.js';

const auth = new Hono();

const registerSchema = z.object({
  nickname: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  password: z.string().min(6),
});

function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/auth/register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { nickname, email, password } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return c.json({ error: 'Email already in use' }, 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ nickname, email, passwordHash });

    const token = generateToken(user._id.toString());

    return c.json({ token, user: user.toJSON() }, 201);
  } catch (err) {
    console.error('[auth/register]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const token = generateToken(user._id.toString());

    return c.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('[auth/login]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/auth/forgot-password
auth.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { email } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists
      return c.json({ message: 'If that email is registered, a reset token has been sent.' });
    }

    const plainToken = generateResetToken();
    const hashedToken = await bcrypt.hash(plainToken, 10);

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + config.resetTokenExpiresIn);
    await user.save();

    // Log for development — email integration is future work
    console.log(`[forgot-password] Reset token for ${email}: ${plainToken}`);

    return c.json({ message: 'If that email is registered, a reset token has been sent.' });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/auth/reset-password
auth.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
    }

    const { resetToken, password } = parsed.data;

    // Find users with a non-expired resetToken
    const users = await User.find({
      resetToken: { $exists: true },
      resetTokenExpiry: { $gt: new Date() },
    });

    let matchedUser = null;
    for (const u of users) {
      if (u.resetToken) {
        const match = await bcrypt.compare(resetToken, u.resetToken);
        if (match) {
          matchedUser = u;
          break;
        }
      }
    }

    if (!matchedUser) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    matchedUser.passwordHash = await bcrypt.hash(password, 12);
    matchedUser.resetToken = undefined;
    matchedUser.resetTokenExpiry = undefined;
    await matchedUser.save();

    return c.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
