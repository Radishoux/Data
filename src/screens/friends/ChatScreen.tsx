import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

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

// ─── Types ─────────────────────────────────────────────────────────────────────
type RootParamList = {
  Chat: { friendId: string; friendNickname: string };
};

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: number;
};

// ─── Mock data ─────────────────────────────────────────────────────────────────
const TODAY_QUESTION = 'If you could instantly master any skill, what would it be and why?';

const mockMessages: Message[] = [
  { id: 'm1', senderId: 'me', content: 'Wait your answer was so good!', createdAt: Date.now() - 300000 },
  { id: 'm2', senderId: 'f1', content: 'Haha thanks! What would you pick?', createdAt: Date.now() - 240000 },
  { id: 'm3', senderId: 'me', content: 'Probably languages, to talk to anyone in the world', createdAt: Date.now() - 180000 },
  { id: 'm4', senderId: 'f1', content: "That's actually so much better than mine 😭", createdAt: Date.now() - 60000 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function Avatar({ nickname, size = 36 }: { nickname: string; size?: number }) {
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

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, isMe }: { message: Message; isMe: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
        ]}
      >
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ─── Context card ──────────────────────────────────────────────────────────────
function ContextCard() {
  return (
    <View style={styles.contextCard}>
      <Text style={styles.contextLabel}>💬 Chatting about today's question</Text>
      <Text style={styles.contextQuestion}>"{TODAY_QUESTION}"</Text>
    </View>
  );
}

// ─── Send icon ─────────────────────────────────────────────────────────────────
function SendIcon({ color }: { color: string }) {
  return (
    <View style={styles.sendIconWrap}>
      <Text style={[styles.sendIconArrow, { color }]}>▶</Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const route = useRoute<RouteProp<RootParamList, 'Chat'>>();
  const { friendId, friendNickname } = route.params ?? { friendId: 'f1', friendNickname: 'Friend' };

  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      content: text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, [inputText]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} isMe={item.senderId === 'me'} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── In-screen header (supplements nav header) ── */}
      <View style={styles.screenHeader}>
        <Avatar nickname={friendNickname} size={38} />
        <View style={styles.screenHeaderText}>
          <Text style={styles.screenHeaderName}>{friendNickname}</Text>
          <Text style={styles.screenHeaderSub}>Friend</Text>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>online</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={<ContextCard />}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── Input bar ── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Say something..."
          placeholderTextColor={C.muted}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive]}
          onPress={sendMessage}
          activeOpacity={0.8}
          disabled={!inputText.trim()}
        >
          <SendIcon color={inputText.trim() ? '#fff' : C.muted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  } as ViewStyle,

  // In-screen header
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 10,
  } as ViewStyle,
  screenHeaderText: {
    flex: 1,
  } as ViewStyle,
  screenHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  } as TextStyle,
  screenHeaderSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 1,
  } as TextStyle,
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  } as ViewStyle,
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  } as ViewStyle,
  onlineText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
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

  // Context card
  contextCard: {
    backgroundColor: C.surface2,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accentLight,
    marginBottom: 6,
    letterSpacing: 0.2,
  } as TextStyle,
  contextQuestion: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 19,
    fontStyle: 'italic',
  } as TextStyle,

  // Message list
  messageList: {
    flex: 1,
  } as ViewStyle,
  messageListContent: {
    paddingTop: 16,
    paddingBottom: 12,
  } as ViewStyle,

  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 16,
  } as ViewStyle,
  bubbleRowMe: {
    justifyContent: 'flex-end',
  } as ViewStyle,
  bubbleRowThem: {
    justifyContent: 'flex-start',
  } as ViewStyle,
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  } as ViewStyle,
  bubbleMe: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 5,
  } as ViewStyle,
  bubbleThem: {
    backgroundColor: C.surface2,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  } as TextStyle,
  bubbleTextMe: {
    color: '#fff',
  } as TextStyle,
  bubbleTextThem: {
    color: C.text,
  } as TextStyle,
  bubbleTime: {
    fontSize: 11,
    marginTop: 4,
  } as TextStyle,
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  } as TextStyle,
  bubbleTimeThem: {
    color: C.muted,
  } as TextStyle,

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  } as ViewStyle,
  input: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: 120,
  } as TextStyle,
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  sendBtnActive: {
    backgroundColor: C.accent,
  } as ViewStyle,
  sendBtnInactive: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  } as ViewStyle,
  sendIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  sendIconArrow: {
    fontSize: 16,
    marginLeft: 2,
  } as TextStyle,
});
