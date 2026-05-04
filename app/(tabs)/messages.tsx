import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
  error: "#FF4444",
  errorBg: "rgba(255, 68, 68, 0.1)",
};

type Conversation = {
  id: number;
  name: string;
  avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export default function MessagesScreen() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du chargement");
      setConversations(data.conversations ?? data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0)
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffDays === 1) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>MESSAGE</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={fetchConversations}
          >
            <Text style={styles.retryText}>RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={COLORS.accent}
            />
          </View>
          <Text style={styles.emptyTitle}>Aucune conversation</Text>
          <Text style={styles.emptyText}>
            Vos échanges avec les propriétaires et locataires apparaîtront ici.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.convItem}
              onPress={() => router.push(`/messages/${conv.id}` as any)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {conv.name?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={styles.convBody}>
                <View style={styles.convTop}>
                  <Text style={styles.convName}>{conv.name ?? "Utilisateur"}</Text>
                  {conv.last_message_at && (
                    <Text style={[styles.convTime, conv.unread_count > 0 && styles.convTimeUnread]}>
                      {formatTime(conv.last_message_at)}
                    </Text>
                  )}
                </View>
                <View style={styles.convBottom}>
                  <Text
                    style={[styles.convLastMsg, conv.unread_count > 0 && styles.convLastMsgUnread]}
                    numberOfLines={1}
                  >
                    {conv.last_message ?? "Démarrer la conversation"}
                  </Text>
                  {conv.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{conv.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: "700",
    letterSpacing: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: COLORS.errorBg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  retryText: {
    color: COLORS.error,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "800",
  },
  convBody: {
    flex: 1,
    justifyContent: "center",
  },
  convTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  convName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  convTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  convTimeUnread: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  convBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convLastMsg: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    marginRight: 12,
  },
  convLastMsgUnread: {
    color: COLORS.text,
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: "800",
  },
});
