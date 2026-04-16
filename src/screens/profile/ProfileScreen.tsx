import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useStore } from '../../store/useStore';
import { answersAPI, usersAPI, questionsAPI, friendsAPI } from '../../services/api';
import { Answer, Question, User } from '../../types';
import Avatar from '../../components/Avatar';
import { ProfileStackParamList, MainTabParamList } from '../../navigation/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedAnswer extends Answer {
  questionText: string;
  category?: string;
}

type ProfileNav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>,
  BottomTabNavigationProp<MainTabParamList>
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMemberSince(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.includes('T') ? '' : 'T12:00:00'));
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatAnswerDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.includes('T') ? '' : 'T12:00:00'));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Answer Card ─────────────────────────────────────────────────────────────

function AnswerCard({ item }: { item: EnrichedAnswer }) {
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
  const storeUser = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const [user, setLocalUser] = useState<User | null>(storeUser);
  const [answers, setAnswers] = useState<EnrichedAnswer[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<ProfileNav>();

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, answersRes, questionsRes, friendsRes] = await Promise.all([
        usersAPI.getMe(),
        answersAPI.getMyAnswers(),
        questionsAPI.getAll(),
        friendsAPI.getFriends().catch(() => ({ data: { friends: [] } })),
      ]);

      const fetchedUser = meRes.data.user;
      setLocalUser(fetchedUser);
      setUser(fetchedUser);

      const questionsMap: Record<string, Question> = {};
      for (const q of questionsRes.data.questions) {
        questionsMap[q.id] = q;
      }

      const enriched: EnrichedAnswer[] = answersRes.data.answers.map((a) => ({
        ...a,
        questionText: questionsMap[a.questionId]?.text ?? 'Unknown question',
        category: questionsMap[a.questionId]?.category,
      }));

      // Sort newest first
      enriched.sort(
        (a, b) =>
          new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime()
      );

      setAnswers(enriched);
      setFriendsCount((friendsRes.data.friends ?? []).length);
    } catch (err: any) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const displayUser: User = user ?? {
    id: 'placeholder',
    nickname: 'You',
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const last10 = answers.slice(0, 10);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile header ── */}
      <View style={styles.headerSection}>
        <View style={styles.avatarRow}>
          <Avatar userId={displayUser.id} size={100} />
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Settings')}
          >
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
        <StatItem value={answers.length} label="answers" />
        <View style={styles.statSeparator} />
        <StatItem value={friendsCount} label="friends" />
        <View style={styles.statSeparator} />
        <StatItem value="—" label="reactions" />
      </View>

      {/* ── Answers section ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Answers</Text>
          {!loading && answers.length > 0 && (
            <Text style={styles.sectionCount}>{answers.length} total</Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchData}
              activeOpacity={0.75}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : answers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No answers yet. Answer today's question!
            </Text>
          </View>
        ) : (
          <>
            {last10.map((item) => (
              <AnswerCard key={item.id} item={item} />
            ))}

            {answers.length > 10 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('AllAnswers', {
                    userId: displayUser.id,
                    nickname: displayUser.nickname,
                    isOwnProfile: true,
                  })
                }
              >
                <Text style={styles.viewAllText}>
                  View All ({answers.length})
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
    marginBottom: 4,
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

  // View all button
  viewAllButton: {
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111111',
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#9F7AEA',
    fontWeight: '600',
  },

  // States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111111',
  },
  retryText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
  },
});
