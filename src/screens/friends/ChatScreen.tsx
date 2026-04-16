import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { WS_BASE_URL, API_BASE_URL } from '../../config/api';
import { useStore } from '../../store';
import Avatar from '../../components/Avatar';
import type { Message } from '../../types';

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

// ─── Route types ───────────────────────────────────────────────────────────────
type RootParamList = {
  Chat: { friendId: string; friendNickname: string };
};

// ─── WS connection state ───────────────────────────────────────────────────────
type WsStatus = 'connecting' | 'open' | 'error' | 'closed';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts: string | number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, isMe }: { message: Message; isMe: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
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
function ContextCard({ question }: { question: string }) {
  return (
    <View style={styles.contextCard}>
      <Text style={styles.contextLabel}>💬 Chatting about today's question</Text>
      <Text style={styles.contextQuestion}>"{question}"</Text>
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
  const { friendId, friendNickname } = route.params ?? { friendId: '', friendNickname: 'Friend' };

  const token = useStore((s) => s.token);
  const myUserId = useStore((s) => s.user?.id ?? null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [todayQuestion, setTodayQuestion] = useState('Today\'s question');

  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ── Fetch today's question ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/questions/today`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'question' in data &&
          data.question &&
          typeof data.question === 'object' &&
          'text' in data.question &&
          typeof (data.question as Record<string, unknown>).text === 'string'
        ) {
          setTodayQuestion((data.question as { text: string }).text);
        }
      })
      .catch(() => {/* non-critical */});
  }, [token]);

  // ── Fetch message history ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !friendId) return;

    setHistoryLoading(true);
    fetch(`${API_BASE_URL}/api/messages/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'messages' in data &&
          Array.isArray((data as { messages: unknown }).messages)
        ) {
          setMessages((data as { messages: Message[] }).messages);
        }
      })
      .catch(() => {/* show empty history on error */})
      .finally(() => setHistoryLoading(false));
  }, [token, friendId]);

  // ── WebSocket lifecycle ─────────────────────────────────────────────────────
  const connectWs = useCallback(() => {
    if (!token) return;

    setWsStatus('connecting');
    const ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('open');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          message?: Message;
        };

        if (data.type === 'message' || data.type === 'sent') {
          if (data.message) {
            setMessages((prev) => {
              // Deduplicate by id — optimistic message gets replaced by confirmed one
              const exists = prev.some((m) => m.id === data.message!.id);
              if (exists) return prev;
              return [...prev, data.message!];
            });
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 80);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = () => {
      setWsStatus('closed');
    };
  }, [token]);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connectWs]);

  // ── Auto-scroll when history loads ─────────────────────────────────────────
  useEffect(() => {
    if (!historyLoading && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [historyLoading]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    // Optimistic UI — use a temp id that will be replaced by server confirmation
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: myUserId ?? 'me',
      receiverId: friendId,
      content: text,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'message',
          receiverId: friendId,
          content: text,
        })
      );
    }
  }, [inputText, friendId, myUserId]);

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = item.senderId === myUserId || item.senderId === 'me';
      return <MessageBubble message={item} isMe={isMe} />;
    },
    [myUserId]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // ── WS status indicator ─────────────────────────────────────────────────────
  const wsStatusNode = () => {
    if (wsStatus === 'connecting') {
      return <Text style={styles.wsStatusConnecting}>Connecting...</Text>;
    }
    if (wsStatus === 'error' || wsStatus === 'closed') {
      return (
        <TouchableOpacity onPress={connectWs} style={styles.reconnectBtn}>
          <Text style={styles.reconnectText}>Reconnect</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ── In-screen header ── */}
      <View style={styles.screenHeader}>
        <Avatar userId={friendId} size={36} />
        <View style={styles.screenHeaderText}>
          <Text style={styles.screenHeaderName}>{friendNickname}</Text>
          {wsStatusNode() ?? <Text style={styles.screenHeaderSub}>Friend</Text>}
        </View>
        {wsStatus === 'open' && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>online</Text>
          </View>
        )}
      </View>

      {/* ── Messages ── */}
      {historyLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={C.accentLight} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={<ContextCard question={todayQuestion} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

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
          style={[
            styles.sendBtn,
            inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive,
          ]}
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

  // WS status
  wsStatusConnecting: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  } as TextStyle,
  reconnectBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
  } as ViewStyle,
  reconnectText: {
    fontSize: 11,
    color: C.accentLight,
    fontWeight: '600',
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

  // Loading / empty
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  loadingText: {
    fontSize: 14,
    color: C.muted,
  } as TextStyle,
  emptyText: {
    textAlign: 'center',
    color: C.muted,
    fontSize: 14,
    marginTop: 40,
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
