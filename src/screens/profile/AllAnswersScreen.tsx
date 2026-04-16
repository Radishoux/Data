import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FriendsStackParamList } from '../../navigation/types';
import { answersAPI, questionsAPI } from '../../services/api';
import { Answer, Question } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<FriendsStackParamList, 'AllAnswers'>;

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

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.skeletonLine, { width: '70%', height: 13 }]} />
        <View style={[styles.skeletonLine, { width: 60, height: 11 }]} />
      </View>
      <View style={styles.divider} />
      <View style={[styles.skeletonLine, { width: '100%', height: 14, marginBottom: 4 }]} />
      <View style={[styles.skeletonLine, { width: '85%', height: 14 }]} />
    </View>
  );
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
          <Text style={styles.questionText} numberOfLines={3}>
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

export default function AllAnswersScreen({ route, navigation }: Props) {
  const { userId, nickname, isOwnProfile } = route.params;

  const [answers, setAnswers] = useState<EnrichedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const title = isOwnProfile ? 'My Answers' : `${nickname}'s Answers`;

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [answersRes, questionsRes] = await Promise.all([
        isOwnProfile
          ? answersAPI.getMyAnswers()
          : answersAPI.getUserAnswers(userId),
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
      setError('Failed to load answers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, isOwnProfile]);

  useEffect(() => {
    navigation.setOptions({ title });
    fetchData();
  }, [fetchData, navigation, title]);

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = search.trim()
    ? answers.filter(
        (a) =>
          a.questionText.toLowerCase().includes(search.toLowerCase()) ||
          a.content.toLowerCase().includes(search.toLowerCase())
      )
    : answers;

  // ── Render ───────────────────────────────────────────────────────────────

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
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search answers..."
          placeholderTextColor="#555555"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchData}
            activeOpacity={0.75}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AnswerCard item={item} />}
          contentContainerStyle={
            filtered.length === 0
              ? styles.emptyContainer
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>No answers yet</Text>
            </View>
          }
        />
      )}
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  clearIcon: {
    fontSize: 13,
    color: COLORS.muted,
    paddingHorizontal: 4,
  },

  // List
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
  },

  // Center state (empty / error)
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '500',
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

  // Skeleton
  skeletonLine: {
    backgroundColor: COLORS.surface2,
    borderRadius: 4,
    marginBottom: 6,
  },
});
