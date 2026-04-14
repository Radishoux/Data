import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

// Inline store types since store file is not yet wired
interface User {
  id: string;
  nickname: string;
  avatarUri?: string;
  createdAt: string;
}

// Minimal store hook fallback — replace with real useStore once wired
function useStore() {
  return {
    user: {
      id: 'user_1',
      nickname: 'Rudy',
      avatarUri: undefined,
      createdAt: '2024-01-15',
    } as User,
    answers: [] as { id: string; userId: string; questionId: string; content: string; answeredAt: string }[],
  };
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ANSWERS = [
  {
    id: 'a1',
    questionId: 'q_2026_04_14',
    questionText: 'What is the one habit that has changed your life the most?',
    content:
      'Waking up at 6am and spending the first hour without my phone. It completely rewired how I think and plan my days.',
    answeredAt: '2026-04-14',
  },
  {
    id: 'a2',
    questionId: 'q_2026_04_13',
    questionText: 'Describe the last time you felt truly proud of yourself.',
    content:
      'When I shipped my first side project that real users actually paid for. It was small but it felt like everything clicked.',
    answeredAt: '2026-04-13',
  },
  {
    id: 'a3',
    questionId: 'q_2026_04_12',
    questionText: 'What do you wish you had started earlier in life?',
    content: 'Learning to say no. I spent years overcommitting and burning out. Boundaries are freedom.',
    answeredAt: '2026-04-12',
  },
  {
    id: 'a4',
    questionId: 'q_2026_04_11',
    questionText: 'If your 10-year-old self met you today, what would surprise them most?',
    content:
      'That I actually enjoy cooking. As a kid I thought it was the most boring adult activity imaginable.',
    answeredAt: '2026-04-11',
  },
  {
    id: 'a5',
    questionId: 'q_2026_04_10',
    questionText: 'What is something you believe that most people around you do not?',
    content:
      'That rest is productive. Most people I know feel guilty for doing nothing. I think nothing-time is where the best ideas live.',
    answeredAt: '2026-04-10',
  },
];

const MOCK_STATS = {
  answers: 47,
  friends: 12,
  reactions: 134,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(nickname: string): string {
  return nickname
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatMemberSince(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatAnswerDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user }: { user: User }) {
  if (user.avatarUri) {
    return <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />;
  }
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{getInitials(user.nickname)}</Text>
    </View>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────
function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Answer Card ─────────────────────────────────────────────────────────────
function AnswerCard({
  item,
}: {
  item: {
    id: string;
    questionText: string;
    content: string;
    answeredAt: string;
  };
}) {
  return (
    <View style={styles.answerCard}>
      <View style={styles.answerCardTop}>
        <Text style={styles.answerQuestion} numberOfLines={2}>
          {item.questionText}
        </Text>
        <Text style={styles.answerDate}>{formatAnswerDate(item.answeredAt)}</Text>
      </View>
      <View style={styles.answerDivider} />
      <Text style={styles.answerContent}>{item.content}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user } = useStore();

  const displayUser: User = user ?? {
    id: 'placeholder',
    nickname: 'You',
    createdAt: new Date().toISOString().slice(0, 10),
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile header ── */}
      <View style={styles.headerSection}>
        <View style={styles.avatarRow}>
          <Avatar user={displayUser} />
          <TouchableOpacity style={styles.editButton} activeOpacity={0.75}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.nickname}>{displayUser.nickname}</Text>
        <Text style={styles.memberSince}>
          Member since {formatMemberSince(displayUser.createdAt)}
        </Text>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatItem value={MOCK_STATS.answers} label="answers" />
        <View style={styles.statSeparator} />
        <StatItem value={MOCK_STATS.friends} label="friends" />
        <View style={styles.statSeparator} />
        <StatItem value={MOCK_STATS.reactions} label="reactions" />
      </View>

      {/* ── Answers section ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Answers</Text>
          <Text style={styles.sectionCount}>{MOCK_STATS.answers} total</Text>
        </View>

        {MOCK_ANSWERS.map((item) => (
          <AnswerCard key={item.id} item={item} />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: {
    paddingBottom: 48,
  },

  // Header section
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarRow: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b1f6e',
    borderWidth: 3,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#111111',
  },
  editButtonText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
  },
  nickname: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  memberSince: {
    fontSize: 13,
    color: '#555555',
    letterSpacing: 0.2,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
    paddingVertical: 20,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#555555',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statSeparator: {
    width: 1,
    height: 36,
    backgroundColor: '#222222',
  },

  // Answers section
  section: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
  },

  // Answer card
  answerCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  answerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  answerQuestion: {
    flex: 1,
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    lineHeight: 18,
  },
  answerDate: {
    fontSize: 11,
    color: '#444444',
    fontWeight: '500',
    flexShrink: 0,
    marginTop: 1,
  },
  answerDivider: {
    height: 1,
    backgroundColor: '#1a1a1a',
  },
  answerContent: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 21,
  },
});
