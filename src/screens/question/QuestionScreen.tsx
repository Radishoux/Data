import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { getTodayQuestion, CATEGORY_EMOJI } from '../../data/questions';
import { questionsAPI, answersAPI } from '../../services/api';
import type { Question } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function QuestionScreen() {
  const { user, addAnswer } = useStore();

  // Server-fetched question (falls back to local data while loading)
  const [question, setQuestion] = useState<Question>(getTodayQuestion());
  const [inputText, setInputText] = useState('');
  const [alreadyAnswered, setAlreadyAnswered] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  const todayStr = getTodayString();
  const categoryEmoji = CATEGORY_EMOJI[question.category ?? 'Wild Card'] ?? '✨';

  // Fetch today's question + check if already answered
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [qRes, aRes] = await Promise.all([
          questionsAPI.getToday(),
          answersAPI.getMyAnswers(),
        ]);
        if (cancelled) return;
        const serverQuestion = qRes.data.question;
        setQuestion(serverQuestion);
        const existing = aRes.data.answers.find(
          (a) => a.questionId === serverQuestion.id
        );
        if (existing) setAlreadyAnswered(existing.content);
      } catch {
        // keep local fallback, no blocking error
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAnswered = !!alreadyAnswered || submitted;
  const displayedAnswer = alreadyAnswered ?? (submitted ? inputText : '');

  async function handleSubmit() {
    const trimmed = inputText.trim();
    if (!trimmed || !user || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await answersAPI.postAnswer({
        questionId: question.id,
        content: trimmed,
      });
      addAnswer(res.data.answer);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.error ?? 'Failed to submit. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDisplayDate(todayStr)}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {categoryEmoji} {question.category ?? 'Daily'}
            </Text>
          </View>
        </View>

        {/* ── Question Card with gradient border ── */}
        <LinearGradient
          colors={['#7C3AED', '#9F7AEA', '#4C1D95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardInner}>
            <Text style={styles.questionLabel}>TODAY'S QUESTION</Text>
            {initialLoading ? (
              <ActivityIndicator color="#7C3AED" style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.questionText}>{question.text}</Text>
            )}
          </View>
        </LinearGradient>

        {/* ── Answer area ── */}
        {!initialLoading && (
          isAnswered ? (
            <AnsweredView answer={displayedAnswer} />
          ) : (
            <InputView
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSubmit}
              loading={submitting}
              error={submitError}
            />
          )
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Answered State ───────────────────────────────────────────────────────────
function AnsweredView({ answer }: { answer: string }) {
  return (
    <View style={styles.answeredWrapper}>
      <View style={styles.answeredHeader}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <View>
          <Text style={styles.answeredTitle}>You answered today</Text>
          <Text style={styles.answeredSubtitle}>Come back tomorrow for a new question</Text>
        </View>
      </View>
      <View style={styles.answeredCard}>
        <Text style={styles.answeredLabel}>YOUR ANSWER</Text>
        <Text style={styles.answeredText}>{answer}</Text>
      </View>
    </View>
  );
}

// ─── Input State ─────────────────────────────────────────────────────────────
function InputView({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  value: string;
  onChange: (t: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  const canSubmit = value.trim().length > 0 && !loading;

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>YOUR ANSWER</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Write your answer here…"
        placeholderTextColor="#444444"
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        autoCorrect
        editable={!loading}
      />
      {error ? <Text style={styles.submitError}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={onSubmit}
        activeOpacity={0.8}
        disabled={!canSubmit}
      >
        <LinearGradient
          colors={canSubmit ? ['#7C3AED', '#6D28D9'] : ['#2a2a2a', '#2a2a2a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              Submit Answer
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.hint}>Your answer is visible to your friends</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  dateText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  categoryBadge: {
    backgroundColor: '#1a0a2e',
    borderWidth: 1,
    borderColor: '#3b1f6e',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#9F7AEA',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Question card
  cardGradient: {
    borderRadius: 20,
    padding: 2,
    marginBottom: 32,
  },
  cardInner: {
    backgroundColor: '#111111',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 2,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.2,
  },

  // Input area
  inputWrapper: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 2,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 140,
    lineHeight: 24,
  },
  submitError: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  submitTextDisabled: {
    color: '#666666',
  },
  hint: {
    fontSize: 12,
    color: '#444444',
    textAlign: 'center',
    marginTop: 4,
  },

  // Answered state
  answeredWrapper: {
    gap: 16,
  },
  answeredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0d1a0d',
    borderWidth: 1,
    borderColor: '#1a3a1a',
    borderRadius: 14,
    padding: 16,
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 18,
    color: '#4ade80',
    fontWeight: '700',
  },
  answeredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4ade80',
    marginBottom: 2,
  },
  answeredSubtitle: {
    fontSize: 12,
    color: '#166534',
  },
  answeredCard: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  answeredLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 2,
  },
  answeredText: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
});
