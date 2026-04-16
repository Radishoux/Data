import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser, createFriendship } from './helpers';
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

// ─── GET /api/messages/:friendId ─────────────────────────────────────────────

describe('GET /api/messages/:friendId', () => {
  it('returns empty array when no messages exist between friends', async () => {
    const { user: alice, token: aliceToken } = await createTestUser({ nickname: 'Alice' });
    const { user: bob } = await createTestUser({ nickname: 'Bob' });
    await createFriendship(alice._id.toString(), bob._id.toString());

    const res = await app.request(`/api/messages/${bob._id.toString()}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { messages: unknown[] };
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages.length).toBe(0);
  });

  it('returns 403 when not friends', async () => {
    const { user: alice, token: aliceToken } = await createTestUser({ nickname: 'Alice' });
    const { user: charlie } = await createTestUser({ nickname: 'Charlie' });
    // No friendship created

    const res = await app.request(`/api/messages/${charlie._id.toString()}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const { user } = await createTestUser();
    const res = await app.request(`/api/messages/${user._id.toString()}`);
    expect(res.status).toBe(401);
  });

  it('returns messages sorted oldest-first after posting', async () => {
    const { user: alice, token: aliceToken } = await createTestUser({ nickname: 'Alice' });
    const { user: bob, token: bobToken } = await createTestUser({ nickname: 'Bob' });
    await createFriendship(alice._id.toString(), bob._id.toString());

    // Alice sends a message via POST
    await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ receiverId: bob._id.toString(), content: 'Hello Bob!' }),
    });

    // Bob replies
    await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bobToken}` },
      body: JSON.stringify({ receiverId: alice._id.toString(), content: 'Hi Alice!' }),
    });

    const res = await app.request(`/api/messages/${bob._id.toString()}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { messages: Array<{ content: string; senderId: string; createdAt: string }> };
    expect(body.messages.length).toBe(2);
    expect(body.messages[0]!.content).toBe('Hello Bob!');
    expect(body.messages[1]!.content).toBe('Hi Alice!');

    // Verify ascending order
    const t0 = new Date(body.messages[0]!.createdAt).getTime();
    const t1 = new Date(body.messages[1]!.createdAt).getTime();
    expect(t0).toBeLessThanOrEqual(t1);
  });
});

// ─── POST /api/messages ───────────────────────────────────────────────────────

describe('POST /api/messages', () => {
  it('creates a message between friends', async () => {
    const { user: alice, token: aliceToken } = await createTestUser({ nickname: 'Alice' });
    const { user: bob } = await createTestUser({ nickname: 'Bob' });
    await createFriendship(alice._id.toString(), bob._id.toString());

    const res = await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ receiverId: bob._id.toString(), content: 'Hey there!' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { message: { content: string; senderId: string; receiverId: string; id: string } };
    expect(body.message).toBeDefined();
    expect(body.message.content).toBe('Hey there!');
    expect(body.message.senderId).toBe(alice._id.toString());
    expect(body.message.receiverId).toBe(bob._id.toString());
    expect(body.message.id).toBeDefined();
  });

  it('returns 403 when not friends', async () => {
    const { token: aliceToken } = await createTestUser({ nickname: 'Alice' });
    const { user: charlie } = await createTestUser({ nickname: 'Charlie' });

    const res = await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ receiverId: charlie._id.toString(), content: 'You cannot message me' }),
    });

    expect(res.status).toBe(403);
  });

  it('rejects empty content', async () => {
    const { user: alice, token: aliceToken } = await createTestUser({ nickname: 'Alice' });
    const { user: bob } = await createTestUser({ nickname: 'Bob' });
    await createFriendship(alice._id.toString(), bob._id.toString());

    const res = await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ receiverId: bob._id.toString(), content: '' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('rejects missing receiverId', async () => {
    const { token: aliceToken } = await createTestUser({ nickname: 'Alice' });

    const res = await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ content: 'No receiver specified' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const { user } = await createTestUser();

    const res = await app.request('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: user._id.toString(), content: 'Unauthorized' }),
    });

    expect(res.status).toBe(401);
  });
});
