import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FriendsStackParamList } from '../../navigation/types';
import { friendsAPI, answersAPI, questionsAPI } from '../../services/api';
import { FriendWithUser, FriendRequest, FriendTodayAnswer } from '../../types';
import Avatar from '../../components/Avatar';

type FriendsNav = NativeStackNavigationProp<FriendsStackParamList>;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  surface: '#111111',
  surface2: '#1a1a1a',
  border: '#222222',
  accent: '#7C3AED',
  accentLight: '#9F7AEA',
  text: '#ffffff',
  muted: '#888888',
  success: '#22C55E',
  error: '#EF4444',
};

const EMOJI_PICKER = ['❤️', '😂', '🔥', '🤔', '😮', '👏'];

// ─── Reaction row ──────────────────────────────────────────────────────────────
function ReactionRow({
  reactions,
  myReactions,
  onToggle,
  onOpenPicker,
}: {
  reactions: Record<string, number>;
  myReactions: Set<string>;
  onToggle: (emoji: string) => void;
  onOpenPicker: () => void;
}) {
  return (
    <View style={styles.reactionRow}>
      {Object.entries(reactions).map(([emoji, count]) => (
        <TouchableOpacity
          key={emoji}
          style={[styles.reactionChip, myReactions.has(emoji) && styles.reactionChipActive]}
          onPress={() => onToggle(emoji)}
          activeOpacity={0.7}
        >
          <Text style={styles.reactionEmoji}>{emoji}</Text>
          <Text style={[styles.reactionCount, myReactions.has(emoji) && styles.reactionCountActive]}>
            {count}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.addReactionBtn} onPress={onOpenPicker} activeOpacity={0.7}>
        <Text style={styles.addReactionText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Emoji picker popup ────────────────────────────────────────────────────────
function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <View style={styles.pickerContainer}>
          {EMOJI_PICKER.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.pickerEmoji}
              onPress={() => {
                onSelect(emoji);
                onClose();
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.pickerEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Answer card ──────────────────────────────────────────────────────────────
function AnswerCard({
  item,
  onChat,
}: {
  item: FriendTodayAnswer;
  onChat: () => void;
}) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const TRUNCATE = 100;
  const nickname = item.user?.nickname ?? 'Unknown';
  const userId = item.user?.id ?? 'unknown';
  const answerText = item.answer.content;
  const shouldTruncate = answerText.length > TRUNCATE;
  const displayText =
    shouldTruncate && !expanded ? answerText.slice(0, TRUNCATE) + '…' : answerText;

  const toggleReaction = (emoji: string) => {
    setReactions((prev) => {
      const current = prev[emoji] ?? 0;
      if (myReactions.has(emoji)) {
        const next = { ...prev, [emoji]: current - 1 };
        if (next[emoji]! <= 0) delete next[emoji];
        return next;
      }
      return { ...prev, [emoji]: current + 1 };
    });
    setMyReactions((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
  };

  const addNewReaction = (emoji: string) => {
    if (!myReactions.has(emoji)) toggleReaction(emoji);
  };

  return (
    <>
      <TouchableOpacity style={styles.answerCard} onPress={onChat} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <Avatar userId={userId} size={42} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardNickname}>{nickname}</Text>
            <Text style={styles.cardSubtitle}>answered today's question</Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.8}>
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.answerBody}>
          <Text style={styles.answerText}>"{displayText}"</Text>
          {shouldTruncate && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                setExpanded((v) => !v);
              }}
            >
              <Text style={styles.readMore}>{expanded ? 'show less' : 'read more'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <ReactionRow
          reactions={reactions}
          myReactions={myReactions}
          onToggle={toggleReaction}
          onOpenPicker={() => setPickerOpen(true)}
        />
      </TouchableOpacity>

      {pickerOpen && (
        <EmojiPicker onSelect={addNewReaction} onClose={() => setPickerOpen(false)} />
      )}
    </>
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────
function RequestRow({
  item,
  onAccept,
}: {
  item: FriendRequest;
  onAccept: () => void;
}) {
  return (
    <View style={styles.friendRow}>
      <Avatar userId={item.from?.id ?? 'unknown'} size={42} />
      <Text style={styles.friendNickname}>{item.from?.nickname ?? 'Unknown'}</Text>
      <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
        <Text style={styles.acceptBtnText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Friend row ───────────────────────────────────────────────────────────────
function FriendRow({
  friend,
  onView,
}: {
  friend: FriendWithUser;
  onView: () => void;
}) {
  return (
    <View style={styles.friendRow}>
      <Avatar userId={friend.user?.id ?? 'unknown'} size={42} />
      <Text style={styles.friendNickname}>{friend.user?.nickname ?? 'Unknown'}</Text>
      <TouchableOpacity style={styles.viewBtn} onPress={onView} activeOpacity={0.8}>
        <Text style={styles.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function FriendsScreen() {
  const navigation = useNavigation<FriendsNav>();

  const [friends, setFriends] = useState<FriendWithUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [todayFeed, setTodayFeed] = useState<FriendTodayAnswer[]>([]);
  const [todayQuestion, setTodayQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addFriendText, setAddFriendText] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [friendsRes, requestsRes, questionRes, feedRes] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getRequests(),
        questionsAPI.getToday(),
        answersAPI
          .getFriendsTodayFeed()
          .catch(() => ({ data: { questionId: '', answers: [] as FriendTodayAnswer[] } })),
      ]);
      setFriends(friendsRes.data.friends);
      setRequests(requestsRes.data.requests);
      setTodayQuestion(questionRes.data.question.text);
      setTodayFeed(feedRes.data.answers);
    } catch {
      // show empty states on error
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFriend = async () => {
    const id = addFriendText.trim();
    if (!id) return;
    setAddFriendLoading(true);
    setAddFriendError('');
    setAddFriendSuccess('');
    try {
      await friendsAPI.sendRequest({ identifier: id });
      setAddFriendSuccess('Friend request sent!');
      setAddFriendText('');
    } catch (err: any) {
      setAddFriendError(err.response?.data?.error ?? 'Could not send request.');
    } finally {
      setAddFriendLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      await fetchData();
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor={C.accent}
        />
      }
    >
      {/* ── Pending Requests ── */}
      {requests.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Requests</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{requests.length}</Text>
            </View>
          </View>
          {requests.map((item) => (
            <RequestRow
              key={item.request.id}
              item={item}
              onAccept={() => handleAccept(item.request.id)}
            />
          ))}
        </>
      )}

      {/* ── Today's Answers ── */}
      <View style={[styles.sectionHeader, requests.length > 0 ? { marginTop: 28 } : {}]}>
        <Text style={styles.sectionTitle}>Today's Answers</Text>
        {todayFeed.length > 0 && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{todayFeed.length}</Text>
          </View>
        )}
      </View>

      {todayQuestion ? (
        <View style={styles.questionBanner}>
          <Text style={styles.questionLabel}>Today's question</Text>
          <Text style={styles.questionText}>{todayQuestion}</Text>
        </View>
      ) : null}

      {todayFeed.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No friends have answered today yet.</Text>
        </View>
      ) : (
        todayFeed.map((item) => (
          <AnswerCard
            key={item.answer.id}
            item={item}
            onChat={() => {
              if (item.user) {
                navigation.navigate('Chat', {
                  friendId: item.user.id,
                  friendNickname: item.user.nickname,
                });
              }
            }}
          />
        ))
      )}

      {/* ── Friends ── */}
      <View style={[styles.sectionHeader, { marginTop: 32 }]}>
        <Text style={styles.sectionTitle}>Friends</Text>
        {friends.length > 0 && (
          <Text style={styles.friendCount}>{friends.length}</Text>
        )}
      </View>

      {/* Add friend */}
      <View style={styles.addFriendRow}>
        <TextInput
          style={styles.addFriendInput}
          placeholder="Add by email or nickname"
          placeholderTextColor={C.muted}
          value={addFriendText}
          onChangeText={(t) => {
            setAddFriendText(t);
            setAddFriendError('');
            setAddFriendSuccess('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={handleAddFriend}
        />
        <TouchableOpacity
          style={[
            styles.addFriendSendBtn,
            (!addFriendText.trim() || addFriendLoading) && styles.addFriendSendBtnDisabled,
          ]}
          onPress={handleAddFriend}
          disabled={addFriendLoading || !addFriendText.trim()}
          activeOpacity={0.8}
        >
          {addFriendLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addFriendSendText}>+</Text>
          )}
        </TouchableOpacity>
      </View>
      {addFriendError ? <Text style={styles.addFriendError}>{addFriendError}</Text> : null}
      {addFriendSuccess ? <Text style={styles.addFriendSuccess}>{addFriendSuccess}</Text> : null}

      {friends.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Add friends to see their answers.</Text>
        </View>
      ) : (
        friends.map((item) => (
          <FriendRow
            key={item.friendship.id}
            friend={item}
            onView={() => {
              if (item.user) {
                navigation.navigate('FriendProfile', {
                  friendId: item.user.id,
                  friendNickname: item.user.nickname,
                });
              }
            }}
          />
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.2,
  } as TextStyle,
  sectionBadge: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  } as ViewStyle,
  sectionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  } as TextStyle,
  friendCount: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '500',
  } as TextStyle,

  // Question banner
  questionBanner: {
    backgroundColor: C.surface2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  } as ViewStyle,
  questionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.accentLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  } as TextStyle,
  questionText: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 20,
    fontStyle: 'italic',
  } as TextStyle,

  // Empty state
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  emptyText: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
  } as TextStyle,

  // Answer card
  answerCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  } as ViewStyle,
  cardHeaderText: {
    flex: 1,
  } as ViewStyle,
  cardNickname: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  } as TextStyle,
  cardSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 1,
  } as TextStyle,
  chatBtn: {
    backgroundColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  } as ViewStyle,
  chatBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  answerBody: {
    marginBottom: 14,
  } as ViewStyle,
  answerText: {
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 22,
    fontStyle: 'italic',
  } as TextStyle,
  readMore: {
    color: C.accentLight,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  } as TextStyle,

  // Reactions
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  } as ViewStyle,
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  } as ViewStyle,
  reactionChipActive: {
    borderColor: C.accent,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  } as ViewStyle,
  reactionEmoji: {
    fontSize: 14,
  } as TextStyle,
  reactionCount: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '600',
  } as TextStyle,
  reactionCountActive: {
    color: C.accentLight,
  } as TextStyle,
  addReactionBtn: {
    backgroundColor: C.surface2,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  addReactionText: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '600',
    lineHeight: 18,
  } as TextStyle,

  // Emoji picker
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  } as ViewStyle,
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  } as ViewStyle,
  pickerEmoji: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: C.surface2,
  } as ViewStyle,
  pickerEmojiText: {
    fontSize: 22,
  } as TextStyle,

  // Request row
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  } as ViewStyle,
  friendNickname: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  } as TextStyle,
  acceptBtn: {
    backgroundColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  } as ViewStyle,
  acceptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  viewBtn: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  } as ViewStyle,
  viewBtnText: {
    color: C.accentLight,
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,

  // Add friend
  addFriendRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  } as ViewStyle,
  addFriendInput: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  } as TextStyle,
  addFriendSendBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  addFriendSendBtnDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  addFriendSendText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  } as TextStyle,
  addFriendError: {
    fontSize: 13,
    color: C.error,
    marginBottom: 8,
  } as TextStyle,
  addFriendSuccess: {
    fontSize: 13,
    color: C.success,
    marginBottom: 8,
  } as TextStyle,
});
