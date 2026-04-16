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

// ─── GET /api/users/me ────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  it('returns the authenticated user without passwordHash', async () => {
    const { token, user } = await createTestUser({ nickname: 'Alice', email: 'alice@example.com' });

    const res = await app.request('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { user: Record<string, unknown> };
    expect(body.user).toBeDefined();
    expect(body.user.nickname).toBe('Alice');
    expect(body.user.email).toBe('alice@example.com');
    expect(body.user.id).toBe(user._id.toString());
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await app.request('/api/users/me', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────

describe('PATCH /api/users/me', () => {
  it('updates the nickname', async () => {
    const { token } = await createTestUser({ nickname: 'OldName' });

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname: 'NewName' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { user: { nickname: string } };
    expect(body.user.nickname).toBe('NewName');
  });

  it('rejects empty nickname', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname: '' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('rejects nickname longer than 50 characters', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname: 'a'.repeat(51) }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'Ghost' }),
    });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe('GET /api/users/:id', () => {
  it('returns a public user profile without passwordHash', async () => {
    const { token } = await createTestUser({ nickname: 'Viewer' });
    const { user: target } = await createTestUser({ nickname: 'Target', email: 'target@example.com' });

    const res = await app.request(`/api/users/${target._id.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { user: Record<string, unknown> };
    expect(body.user.nickname).toBe('Target');
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('returns 404 for unknown user', async () => {
    const { token } = await createTestUser();
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await app.request(`/api/users/${fakeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('returns 400 for malformed id', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/api/users/not-a-valid-id', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const { user } = await createTestUser();
    const res = await app.request(`/api/users/${user._id.toString()}`);
    expect(res.status).toBe(401);
  });
});
