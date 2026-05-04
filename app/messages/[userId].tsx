import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  accent: "#FFD700",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  border: "#222222",
  success: "#10B981",
  myBubble: "#FFD700",
  otherBubble: "#1E1E1E",
};

type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
};

type OtherUser = {
  id: number;
  name: string;
  avatar: string | null;
};

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadMessages();
    // Polling toutes les 4 secondes
    pollRef.current = setInterval(pollMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages ?? []);
        setOtherUser(data.otherUser ?? null);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const pollMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMessages(data.messages ?? []);
    } catch {}
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);

    // Ajout optimiste
    const optimistic: Message = {
      id: Date.now(),
      sender_id: user!.id,
      receiver_id: Number(userId),
      content,
      created_at: new Date().toISOString(),
      sender_name: user!.name,
      sender_avatar: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`${API_URL}/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        // Recharge pour avoir l'ID réel
        const d = await res.json();
        setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...optimistic, id: d.message.id } : m));
      }
    } catch {}
    finally { setSending(false); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateSep = !prevMsg || formatDate(item.created_at) !== formatDate(prevMsg.created_at);

    return (
      <>
        {showDateSep && (
          <View style={styles.dateSep}>
            <Text style={styles.dateSepText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
          {!isMe && (
            <View style={styles.smallAvatar}>
              {item.sender_avatar ? (
                <Image source={{ uri: item.sender_avatar }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <Text style={styles.smallAvatarText}>{item.sender_name?.charAt(0).toUpperCase() ?? "?"}</Text>
              )}
            </View>
          )}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.accent} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          {otherUser?.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <Text style={styles.headerAvatarText}>{otherUser?.name?.charAt(0).toUpperCase() ?? "?"}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{otherUser?.name ?? "..."}</Text>
          <Text style={styles.headerSub}>En ligne</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="chatbubbles-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyText}>Démarrez la conversation</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={COLORS.bg} />
            : <Ionicons name="send" size={18} color={COLORS.bg} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 6, marginLeft: -6 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,215,0,0.2)",
  },
  headerAvatarText: { color: COLORS.accent, fontWeight: "800", fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 11, color: COLORS.success, fontWeight: "600" },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },

  // Messages list
  messagesList: { padding: 16, gap: 4, flexGrow: 1 },
  dateSep: { alignItems: "center", marginVertical: 12 },
  dateSepText: {
    fontSize: 11, color: COLORS.textMuted, fontWeight: "700",
    backgroundColor: "#111", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4, gap: 8 },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  smallAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,215,0,0.2)",
  },
  smallAvatarText: { color: COLORS.accent, fontSize: 11, fontWeight: "800" },
  bubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  bubbleMe: { backgroundColor: COLORS.myBubble, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.otherBubble, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 14, color: COLORS.bg, lineHeight: 20 },
  bubbleTextMe: { color: COLORS.bg },
  bubbleTime: { fontSize: 10, color: "rgba(0,0,0,0.4)", textAlign: "right" },
  bubbleTimeMe: { color: "rgba(0,0,0,0.4)" },

  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    padding: 12, paddingBottom: Platform.OS === "ios" ? 28 : 12,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, backgroundColor: "#000", borderRadius: 22, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});

