import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  accent: "#FFD700",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  border: "#222222",
};

export default function AccueilScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>
            BONJOUR
            {user?.name ? `, ${user.name.split(" ")[0].toUpperCase()}` : ""}
          </Text>
          <Text style={styles.subGreeting}>
            L'excellence automobile en Guinée
          </Text>
        </View>

        {/* Ton nouveau logo */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
      </View>

      {/* Boutons rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/(tabs)/voitures")}
        >
          <View style={styles.quickIconBox}>
            <Ionicons name="search" size={18} color={COLORS.accent} />
          </View>
          <Text style={styles.quickBtnText}>Parcourir notre catalogue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnPrimary]}
          onPress={() => router.push("/(tabs)/publier")}
        >
          <View style={[styles.quickIconBox, { backgroundColor: COLORS.bg }]}>
            <Ionicons name="add" size={18} color={COLORS.accent} />
          </View>
          <Text style={[styles.quickBtnText, { color: COLORS.bg }]}>
            Publier une annonce
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats / Raccourcis */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/(tabs)/voitures")}
        >
          <Ionicons name="car-sport" size={28} color={COLORS.accent} />
          <Text style={styles.statLabel}>Véhicules{"\n"}disponibles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/mes-reservations")}
        >
          <Ionicons name="calendar" size={28} color={COLORS.textMuted} />
          <Text style={styles.statLabel}>Mes{"\n"}réservations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push("/favoris")}
        >
          <Ionicons name="heart" size={28} color={COLORS.textMuted} />
          <Text style={styles.statLabel}>Mes{"\n"}favoris</Text>
        </TouchableOpacity>
      </View>

      {/* Info Premium */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="star" size={16} color={COLORS.accent} />
          <Text style={styles.infoTitle}>L'EXPÉRIENCE GUICARLOC</Text>
        </View>
        <Text style={styles.infoText}>
          La première plateforme de location de véhicules de prestige et de
          confort en Guinée. Louez ou proposez vos véhicules en toute sécurité
          et simplicité.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  greetingBox: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30, // Rend l'image parfaitement ronde
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)", // Bordure dorée pour le côté néon
    resizeMode: "cover",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBtnPrimary: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 13,
    color: "#D1D5DB",
    lineHeight: 22,
    fontWeight: "500",
  },
});
