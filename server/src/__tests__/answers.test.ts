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

// Derive today's question id the same way the server does
function getTodayQuestionId(): string {
  // Import inline to avoid circular issues at module level
  const questions = [
    'q_001','q_002','q_003','q_004','q_005','q_006','q_007','q_008','q_009','q_010',
    'q_011','q_012','q_013','q_014','q_015','q_016','q_017','q_018','q_019','q_020',
    'q_021','q_022','q_023','q_024','q_025','q_026','q_027','q_028','q_029','q_030',
    'q_031','q_032','q_033','q_034','q_035','q_036','q_037','q_038','q_039','q_040',
    'q_041','q_042','q_043','q_044','q_045','q_046','q_047','q_048','q_049','q_050',
    'q_051','q_052','q_053','q_054','q_055','q_056','q_057','q_058','q_059','q_060',
    'q_061','q_062','q_063','q_064','q_065','q_066','q_067','q_068','q_069','q_070',
    'q_071','q_072','q_073','q_074','q_075','q_076','q_077','q_078','q_079','q_080',
    'q_081','q_082','q_083','q_084','q_085','q_086','q_087','q_088','q_089','q_090',
    'q_091','q_092','q_093','q_094','q_095','q_096','q_097','q_098','q_099','q_100',
    'q_101','q_102','q_103',
  ];
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const index = dayOfYear % questions.length;
  return questions[index] ?? questions[0]!;
}

// ─── POST /api/answers ────────────────────────────────────────────────────────

describe('POST /api/answers', () => {
  it("creates an answer for today's question", async () => {
    const { token } = await createTestUser();
    const questionId = getTodayQuestionId();

    const res = await app.request('/api/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId, content: 'My thoughtful answer' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { answer: { questionId: string; content: string; id: string } };
    expect(body.answer).toBeDefined();
    expect(body.answer.questionId).toBe(questionId);
    expect(body.answer.content).toBe('My thoughtful answer');
    expect(body.answer.id).toBeDefined();
  });

  it("rejects duplicate answer for same question", async () => {
    const { token } = await createTestUser();
    const questionId = getTodayQuestionId();

    // First answer succeeds
    await app.request('/api/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId, content: 'First answer' }),
    });

    // Second answer for same question must fail
    const res = await app.request('/api/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId, content: 'Second attempt' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });

  it('requires authentication', async () => {
    const questionId = getTodayQuestionId();

    const res = await app.request('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, content: 'Unauthorized attempt' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });
});

// ─── GET /api/answers/me ──────────────────────────────────────────────────────

describe('GET /api/answers/me', () => {
  it("returns user's answers sorted by date", async () => {
    const { token } = await createTestUser();

    // Post two answers for different questions
    await app.request('/api/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId: 'q_001', content: 'Answer one' }),
    });

    await app.request('/api/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId: 'q_002', content: 'Answer two' }),
    });

    const res = await app.request('/api/answers/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { answers: Array<{ questionId: string; content: string; answeredAt: string }> };
    expect(Array.isArray(body.answers)).toBe(true);
    expect(body.answers.length).toBe(2);

    // Verify sorted descending by answeredAt (most recent first)
    if (body.answers.length >= 2) {
      const [first, second] = body.answers as [typeof body.answers[0], typeof body.answers[0]];
      const firstDate = new Date(first.answeredAt).getTime();
      const secondDate = new Date(second.answeredAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

  it('returns empty array for new user', async () => {
    const { token } = await createTestUser();

    const res = await app.request('/api/answers/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { answers: unknown[] };
    expect(Array.isArray(body.answers)).toBe(true);
    expect(body.answers.length).toBe(0);
  });

  it('requires authentication', async () => {
    const res = await app.request('/api/answers/me', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
  });
});
