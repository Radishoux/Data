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

// ─── GET /api/questions/today ─────────────────────────────────────────────────

describe('GET /api/questions/today', () => {
  it("returns today's question with id, text, and date", async () => {
    const { token } = await createTestUser();

    const res = await app.request('/api/questions/today', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { question: { id: string; text: string }; date: string };
    expect(body.question).toBeDefined();
    expect(typeof body.question.id).toBe('string');
    expect(typeof body.question.text).toBe('string');
    expect(body.question.text.length).toBeGreaterThan(0);
    expect(typeof body.date).toBe('string');
    // date must be in YYYY-MM-DD format
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the same question on two consecutive calls (same day)', async () => {
    const { token } = await createTestUser();

    const res1 = await app.request('/api/questions/today', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res2 = await app.request('/api/questions/today', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const body1 = await res1.json() as { question: { id: string } };
    const body2 = await res2.json() as { question: { id: string } };
    expect(body1.question.id).toBe(body2.question.id);
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/api/questions/today');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/questions ───────────────────────────────────────────────────────

describe('GET /api/questions', () => {
  it('returns the full question list', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/api/questions', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { questions: Array<{ id: string; text: string }> };
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.questions.length).toBeGreaterThan(0);

    // Each question must have at least id and text
    for (const q of body.questions) {
      expect(typeof q.id).toBe('string');
      expect(typeof q.text).toBe('string');
    }
  });

  it("today's question appears in the full list", async () => {
    const { token } = await createTestUser();

    const [todayRes, allRes] = await Promise.all([
      app.request('/api/questions/today', { headers: { Authorization: `Bearer ${token}` } }),
      app.request('/api/questions', { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const todayBody = await todayRes.json() as { question: { id: string } };
    const allBody = await allRes.json() as { questions: Array<{ id: string }> };

    const ids = allBody.questions.map((q) => q.id);
    expect(ids).toContain(todayBody.question.id);
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/api/questions');
    expect(res.status).toBe(401);
  });
});
