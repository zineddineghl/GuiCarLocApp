import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { requestNotificationPermission } from "../../hooks/usePushNotifications";

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  accent: "#FFD700",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  error: "#FF4444",
  border: "#222222",
};

type MenuItemType = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: { label: string; color: string };
};

export default function ProfilScreen() {
  const { user, signOut, token } = useAuth();

  const handleNotifications = async () => {
    if (!token) return;
    const result = await requestNotificationPermission(token);
    if (result === 'granted') {
      Alert.alert('Notifications activées', 'Vous recevrez des notifications pour vos réservations et messages.');
    } else if (result === 'already_granted') {
      Alert.alert('Déjà activées', 'Les notifications sont déjà activées sur cet appareil.');
    } else {
      Alert.alert('Notifications refusées', 'Activez les notifications dans les réglages de votre téléphone.');
    }
  };

  const handleSignOut = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: signOut },
    ]);
  };

  const roleMap: Record<string, string> = {
    owner: "Propriétaire",
    renter: "Locataire",
    both: "Propriétaire & Locataire",
  };

  const roleLabel = roleMap[user?.role ?? ""] ?? user?.role ?? "Membre";

  const menuItems: MenuItemType[] = [
    {
      icon: "list-outline",
      label: "Mes annonces",
      onPress: () => router.push("/mes-annonces" as any),
    },
    {
      icon: "calendar-outline",
      label: "Mes réservations",
      onPress: () => router.push("/mes-reservations" as any),
    },
    {
      icon: "heart-outline",
      label: "Favoris",
      onPress: () => router.push("/(tabs)/favoris" as any),
    },
    {
      icon: "bar-chart-outline",
      label: "Tableau de bord",
      onPress: () => router.push("/dashboard" as any),
    },
  ];

  const idStatusLabel: Record<string, { label: string; color: string }> = {
    verified: { label: "Vérifié", color: "#10B981" },
    pending: { label: "En attente", color: "#F59E0B" },
    rejected: { label: "Refusé", color: "#FF4444" },
    none: { label: "Non vérifié", color: "#A0A0A0" },
  };
  const idInfo = idStatusLabel[user?.id_status ?? "none"];

  const accountItems: MenuItemType[] = [
    {
      icon: "person-outline",
      label: "Modifier mon profil",
      onPress: () => router.push(`/user/${user?.id}` as any),
    },
    {
      icon: "shield-checkmark-outline",
      label: "Vérification d'identité",
      onPress: () => router.push("/verify-identity" as any),
      badge: idInfo,
    },
    {
      icon: "lock-closed-outline",
      label: "Sécurité et mot de passe",
      onPress: () => router.push("/securite" as any),
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      onPress: handleNotifications,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFIL</Text>
      </View>

      {/* Carte Profil */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? "Utilisateur"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      {/* Section : Mon Espace */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MON ESPACE</Text>
        {menuItems.map((item, i) => (
          <MenuRow key={i} item={item} last={i === menuItems.length - 1} />
        ))}
      </View>

      {/* Section : Mon Compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MON COMPTE</Text>
        {accountItems.map((item, i) => (
          <MenuRow key={i} item={item} last={i === accountItems.length - 1} />
        ))}
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.signOutText}>DÉCONNEXION</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Composant pour les lignes du menu
function MenuRow({ item, last }: { item: MenuItemType; last: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && styles.menuItemLast]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={item.icon} size={20} color={COLORS.accent} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {item.badge && (
          <View style={[styles.badge, { borderColor: item.badge.color }]}>
            <Text style={[styles.badgeText, { color: item.badge.color }]}>{item.badge.label}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: COLORS.text },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: COLORS.bg, fontSize: 26, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  profileEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  roleBadge: {
    marginTop: 8,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accent,
    textTransform: "uppercase",
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: { color: COLORS.error, fontSize: 14, fontWeight: "800" },
});
