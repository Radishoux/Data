import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from './helpers';
import { app } from '../app';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearCollections();
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token + user', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { token: string; user: { nickname: string; email: string; id: string } };
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.user).toBeDefined();
    expect(body.user.nickname).toBe('Alice');
    expect(body.user.email).toBe('alice@example.com');
    // passwordHash must not be exposed
    expect((body.user as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('rejects duplicate email', async () => {
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    });

    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'Alice2',
        email: 'alice@example.com',
        password: 'password456',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('rejects missing fields', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'Bob' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('rejects password shorter than 6 chars', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'Bob',
        email: 'bob@example.com',
        password: '123',
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await createTestUser({ email: 'carol@example.com', password: 'mypassword' });

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', password: 'mypassword' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { token: string; user: { email: string } };
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.user.email).toBe('carol@example.com');
  });

  it('rejects wrong password', async () => {
    await createTestUser({ email: 'dave@example.com', password: 'correctpassword' });

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dave@example.com', password: 'wrongpassword' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('rejects unknown email', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'password123' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('returns success message for valid email', async () => {
    await createTestUser({ email: 'eve@example.com' });

    const res = await app.request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'eve@example.com' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { message: string };
    expect(body.message).toBeDefined();
    expect(typeof body.message).toBe('string');
  });

  it('returns success message even for unknown email (no enumeration)', async () => {
    const res = await app.request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@example.com' }),
    });

    // Must not 404 or reveal that the email doesn't exist
    expect(res.status).toBe(200);
    const body = await res.json() as { message: string };
    expect(body.message).toBeDefined();
    expect(typeof body.message).toBe('string');
  });
});
