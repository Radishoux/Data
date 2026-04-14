import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
};

// ─── Mock data ─────────────────────────────────────────────────────────────────
const TODAY_QUESTION = 'If you could instantly master any skill, what would it be and why?';

const mockFriends = [
  { id: 'f1', nickname: 'Alex', avatarUri: null, online: true },
  { id: 'f2', nickname: 'Jordan', avatarUri: null, online: false },
  { id: 'f3', nickname: 'Sam', avatarUri: null, online: true },
];

type TodayAnswer = {
  friendId: string;
  nickname: string;
  answer: string;
  reactions: Record<string, number>;
};

const mockTodayAnswers: TodayAnswer[] = [
  {
    friendId: 'f1',
    nickname: 'Alex',
    answer: "I'd master coding — imagine building anything in your head instantly.",
    reactions: { '❤️': 2, '🔥': 3 },
  },
  {
    friendId: 'f2',
    nickname: 'Jordan',
    answer: "Music production. I've always wanted to make beats that move people.",
    reactions: { '😂': 1, '👏': 2 },
  },
];

const EMOJI_PICKER = ['❤️', '😂', '🔥', '🤔', '😮', '👏'];

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nickname, size = 44 }: { nickname: string; size?: number }) {
  const initials = nickname.slice(0, 2).toUpperCase();
  const hue = (nickname.charCodeAt(0) * 37) % 360;
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `hsl(${hue}, 55%, 30%)`,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

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
  );
}

// ─── Today's Answer card ───────────────────────────────────────────────────────
function AnswerCard({
  item,
  onChat,
}: {
  item: TodayAnswer;
  onChat: () => void;
}) {
  const [reactions, setReactions] = useState<Record<string, number>>(item.reactions);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const TRUNCATE = 100;
  const shouldTruncate = item.answer.length > TRUNCATE;
  const displayText =
    shouldTruncate && !expanded ? item.answer.slice(0, TRUNCATE) + '…' : item.answer;

  const toggleReaction = (emoji: string) => {
    setReactions((prev) => {
      const current = prev[emoji] ?? 0;
      if (myReactions.has(emoji)) {
        const next = { ...prev, [emoji]: current - 1 };
        if (next[emoji] <= 0) delete next[emoji];
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
    if (!myReactions.has(emoji)) {
      toggleReaction(emoji);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.answerCard} onPress={onChat} activeOpacity={0.85}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Avatar nickname={item.nickname} size={42} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardNickname}>{item.nickname}</Text>
            <Text style={styles.cardSubtitle}>answered today's question</Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.8}>
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Answer */}
        <View style={styles.answerBody}>
          <Text style={styles.answerText}>
            "{displayText}"
          </Text>
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

        {/* Reactions */}
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

// ─── Friend row ────────────────────────────────────────────────────────────────
function FriendRow({
  friend,
  onView,
}: {
  friend: (typeof mockFriends)[0];
  onView: () => void;
}) {
  return (
    <View style={styles.friendRow}>
      <View style={styles.friendAvatarWrap}>
        <Avatar nickname={friend.nickname} size={42} />
        <View style={[styles.onlineDot, { backgroundColor: friend.online ? '#22c55e' : '#444' }]} />
      </View>
      <Text style={styles.friendNickname}>{friend.nickname}</Text>
      <TouchableOpacity style={styles.viewBtn} onPress={onView} activeOpacity={0.8}>
        <Text style={styles.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function FriendsScreen() {
  const navigation = useNavigation<any>();

  const goToChat = (friendId: string, friendNickname: string) => {
    navigation.navigate('Chat', { friendId, friendNickname });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section A: Today's Answers ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Answers</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{mockTodayAnswers.length}</Text>
          </View>
        </View>

        <View style={styles.questionBanner}>
          <Text style={styles.questionLabel}>Today's question</Text>
          <Text style={styles.questionText}>{TODAY_QUESTION}</Text>
        </View>

        {mockTodayAnswers.map((item) => (
          <AnswerCard
            key={item.friendId}
            item={item}
            onChat={() => goToChat(item.friendId, item.nickname)}
          />
        ))}

        {/* ── Section B: Friends ── */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Friends</Text>
        </View>

        <TouchableOpacity
          style={styles.addFriendBtn}
          onPress={() => Alert.alert('Add Friend', 'Friend request feature coming soon!')}
          activeOpacity={0.8}
        >
          <Text style={styles.addFriendText}>+ Add Friend</Text>
        </TouchableOpacity>

        {mockFriends.map((friend) => (
          <FriendRow
            key={friend.id}
            friend={friend}
            onView={() => goToChat(friend.id, friend.nickname)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
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

  // Answer body
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

  // Avatar
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  } as TextStyle,

  // Friend row
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
  friendAvatarWrap: {
    position: 'relative',
  } as ViewStyle,
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.surface,
  } as ViewStyle,
  friendNickname: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
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

  // Add friend button
  addFriendBtn: {
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  addFriendText: {
    color: C.accentLight,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as TextStyle,
});
