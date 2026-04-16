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

// ─── POST /api/friends/request ────────────────────────────────────────────────

describe('POST /api/friends/request', () => {
  it('sends a friend request by email', async () => {
    const { token: tokenA } = await createTestUser({ email: 'alice@example.com', nickname: 'Alice' });
    await createTestUser({ email: 'bob@example.com', nickname: 'Bob' });

    const res = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'bob@example.com' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { friendship: { status: string; requesterId: string } };
    expect(body.friendship).toBeDefined();
    expect(body.friendship.status).toBe('pending');
  });

  it('sends a friend request by nickname', async () => {
    const { token: tokenA } = await createTestUser({ email: 'alice2@example.com', nickname: 'Alice2' });
    await createTestUser({ email: 'bob2@example.com', nickname: 'Bob2' });

    const res = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'Bob2' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { friendship: { status: string } };
    expect(body.friendship.status).toBe('pending');
  });

  it('rejects sending request to yourself', async () => {
    const { token } = await createTestUser({ email: 'self@example.com', nickname: 'Self' });

    const res = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ identifier: 'self@example.com' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('rejects duplicate requests', async () => {
    const { token: tokenA } = await createTestUser({ email: 'dup_a@example.com', nickname: 'DupA' });
    await createTestUser({ email: 'dup_b@example.com', nickname: 'DupB' });

    await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'dup_b@example.com' }),
    });

    const res = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'dup_b@example.com' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('returns 404 for unknown user', async () => {
    const { token } = await createTestUser({ email: 'finder@example.com' });

    const res = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ identifier: 'nobody@example.com' }),
    });

    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'anyone@example.com' }),
    });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/friends/requests ────────────────────────────────────────────────

describe('GET /api/friends/requests', () => {
  it('returns incoming pending requests with requester info', async () => {
    const { token: tokenA } = await createTestUser({ email: 'sender@example.com', nickname: 'Sender' });
    const { token: tokenB } = await createTestUser({ email: 'receiver@example.com', nickname: 'Receiver' });

    await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'receiver@example.com' }),
    });

    const res = await app.request('/api/friends/requests', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as {
      requests: Array<{ request: { status: string }; from: { nickname: string } | null }>;
    };
    expect(Array.isArray(body.requests)).toBe(true);
    expect(body.requests.length).toBe(1);
    expect(body.requests[0]!.request.status).toBe('pending');
    expect(body.requests[0]!.from?.nickname).toBe('Sender');
  });

  it('returns empty array when no pending requests', async () => {
    const { token } = await createTestUser({ email: 'noreqs@example.com' });

    const res = await app.request('/api/friends/requests', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { requests: unknown[] };
    expect(Array.isArray(body.requests)).toBe(true);
    expect(body.requests.length).toBe(0);
  });

  it('requires authentication', async () => {
    const res = await app.request('/api/friends/requests', { method: 'GET' });
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /api/friends/:requestId/accept ─────────────────────────────────────

describe('PATCH /api/friends/:requestId/accept', () => {
  it('accepts a pending friend request', async () => {
    const { token: tokenA } = await createTestUser({ email: 'req_s@example.com', nickname: 'ReqS' });
    const { token: tokenB } = await createTestUser({ email: 'req_r@example.com', nickname: 'ReqR' });

    const reqRes = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'req_r@example.com' }),
    });
    const reqBody = await reqRes.json() as { friendship: { id: string } };
    const requestId = reqBody.friendship.id;

    const res = await app.request(`/api/friends/${requestId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { friendship: { status: string } };
    expect(body.friendship.status).toBe('accepted');
  });

  it('rejects accept attempt from the sender (not the receiver)', async () => {
    const { token: tokenA } = await createTestUser({ email: 'na_a@example.com', nickname: 'NaA' });
    const { token: tokenB } = await createTestUser({ email: 'na_b@example.com', nickname: 'NaB' });

    const reqRes = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'na_b@example.com' }),
    });
    const reqBody = await reqRes.json() as { friendship: { id: string } };
    const requestId = reqBody.friendship.id;

    // tokenA (sender) tries to accept their own request
    const res = await app.request(`/api/friends/${requestId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown request id', async () => {
    const { token } = await createTestUser({ email: 'notfound@example.com' });

    const res = await app.request('/api/friends/000000000000000000000000/accept', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/friends ─────────────────────────────────────────────────────────

describe('GET /api/friends', () => {
  it('returns empty list when user has no friends', async () => {
    const { token } = await createTestUser({ email: 'lonely@example.com' });

    const res = await app.request('/api/friends', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { friends: unknown[] };
    expect(Array.isArray(body.friends)).toBe(true);
    expect(body.friends.length).toBe(0);
  });

  it('returns accepted friends with user data after accepting a request', async () => {
    const { token: tokenA } = await createTestUser({ email: 'fr_a@example.com', nickname: 'FrA' });
    const { token: tokenB } = await createTestUser({ email: 'fr_b@example.com', nickname: 'FrB' });

    const reqRes = await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'fr_b@example.com' }),
    });
    const reqBody = await reqRes.json() as { friendship: { id: string } };

    await app.request(`/api/friends/${reqBody.friendship.id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    const res = await app.request('/api/friends', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as {
      friends: Array<{ friendship: { status: string }; user: { nickname: string } | null }>;
    };
    expect(body.friends.length).toBe(1);
    expect(body.friends[0]!.friendship.status).toBe('accepted');
    expect(body.friends[0]!.user?.nickname).toBe('FrB');
  });

  it('does NOT include pending requests in friends list', async () => {
    const { token: tokenA } = await createTestUser({ email: 'pending_a@example.com', nickname: 'PA' });
    await createTestUser({ email: 'pending_b@example.com', nickname: 'PB' });

    // Send request but don't accept
    await app.request('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ identifier: 'pending_b@example.com' }),
    });

    const res = await app.request('/api/friends', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { friends: unknown[] };
    expect(body.friends.length).toBe(0);
  });

  it('requires authentication', async () => {
    const res = await app.request('/api/friends', { method: 'GET' });
    expect(res.status).toBe(401);
  });
});
