import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FriendsStackParamList } from '../../navigation/types';
import { answersAPI, questionsAPI } from '../../services/api';
import { Answer, Question } from '../../types';
import Avatar from '../../components/Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<FriendsStackParamList, 'FriendProfile'>;

interface EnrichedAnswer extends Answer {
  questionText: string;
  category?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.includes('T') ? '' : 'T12:00:00'));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Answer Card ─────────────────────────────────────────────────────────────

function AnswerCard({ item }: { item: EnrichedAnswer }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          {item.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          ) : null}
          <Text style={styles.questionText} numberOfLines={2}>
            {item.questionText}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.answeredAt)}</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.answerContent}>{item.content}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FriendProfileScreen({ route, navigation }: Props) {
  const { friendId, friendNickname } = route.params;

  const [answers, setAnswers] = useState<EnrichedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [answersRes, questionsRes] = await Promise.all([
        answersAPI.getUserAnswers(friendId),
        questionsAPI.getAll(),
      ]);

      const questionsMap: Record<string, Question> = {};
      for (const q of questionsRes.data.questions) {
        questionsMap[q.id] = q;
      }

      const enriched: EnrichedAnswer[] = answersRes.data.answers.map((a) => ({
        ...a,
        questionText:
          questionsMap[a.questionId]?.text ?? 'Unknown question',
        category: questionsMap[a.questionId]?.category,
      }));

      // Sort newest first
      enriched.sort(
        (a, b) =>
          new Date(b.answeredAt).getTime() - new Date(a.answeredAt).getTime()
      );

      setAnswers(enriched);
    } catch (err: any) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Render ───────────────────────────────────────────────────────────────

  const last10 = answers.slice(0, 10);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friendNickname}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <View style={styles.profileSection}>
          <Avatar userId={friendId} size={90} />
          <Text style={styles.nickname}>{friendNickname}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.messageButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('Chat', {
                friendId,
                friendNickname,
              })
            }
          >
            <Text style={styles.messageButtonText}>Send message</Text>
          </TouchableOpacity>
        </View>

        {/* Answers section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Answers</Text>
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
              <Text style={styles.emptyText}>No answers yet.</Text>
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
                      userId: friendId,
                      nickname: friendNickname,
                      isOwnProfile: false,
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#0a0a0a',
  surface: '#111111',
  surface2: '#1a1a1a',
  border: '#222222',
  accent: '#7C3AED',
  accentLight: '#9F7AEA',
  text: '#ffffff',
  muted: '#888888',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.accent,
    lineHeight: 32,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Profile section
  profileSection: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  nickname: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.3,
  },

  // Actions
  actionsRow: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  messageButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },

  // Section
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
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface2,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTopLeft: {
    flex: 1,
    gap: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    lineHeight: 18,
  },
  dateText: {
    fontSize: 11,
    color: '#444444',
    fontWeight: '500',
    flexShrink: 0,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface2,
  },
  answerContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },

  // View all
  viewAllButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.accentLight,
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
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  retryText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface2,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
