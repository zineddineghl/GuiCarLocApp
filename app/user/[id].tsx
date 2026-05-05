import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  accent: "#FFD700",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  border: "#222222",
  error: "#FF4444",
  success: "#10B981",
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams(); // Récupère l'ID de l'URL
  const { user: authUser, token } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const isOwn = authUser && String(authUser.id) === String(id);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setListings(data.listings || []);
        setReviews(data.reviews || []);
        setEditForm({
          name: data.user.name || "",
          bio: data.user.bio || "",
          phone: data.user.phone || "",
        });
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!isOwn) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    const formData = new FormData();
    const uriParts = uri.split(".");
    const fileType = uriParts[uriParts.length - 1];

    formData.append("avatar", {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) setProfile({ ...profile, avatar: data.avatar });
    } catch (e) {
      Alert.alert("Erreur", "Échec de l'importation de l'image");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, ...data.user });
        setEditing(false);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  const toggle2FA = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/2fa`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile({ ...profile, two_fa_enabled: data.two_fa_enabled });
      Alert.alert(
        "Sécurité",
        data.two_fa_enabled ? "2FA activé" : "2FA désactivé",
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>PROFIL</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Photo & Identity */}
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={handlePickImage} disabled={!isOwn}>
            <View style={styles.avatarContainer}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {profile.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isOwn && (
                <View style={styles.editIconBadge}>
                  <Ionicons name="camera" size={16} color={COLORS.bg} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.identityInfo}>
            <Text style={styles.userName}>{profile.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{profile.role?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.listings_count || 0}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Number(profile.avg_owner_rating || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.review_count || 0}</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
        </View>

        {/* Formulaire ou Bio */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>À PROPOS</Text>
            {isOwn && (
              <TouchableOpacity
                onPress={() =>
                  editing ? handleSaveProfile() : setEditing(true)
                }
              >
                <Text style={styles.editBtnText}>
                  {saving ? "..." : editing ? "ENREGISTRER" : "MODIFIER"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={COLORS.textMuted}
                value={editForm.name}
                onChangeText={(t) => setEditForm({ ...editForm, name: t })}
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Votre bio..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={editForm.bio}
                onChangeText={(t) => setEditForm({ ...editForm, bio: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.bioText}>
                {profile.bio || "Aucune description fournie."}
              </Text>
              {profile.phone && (
                <View style={styles.phoneRow}>
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={COLORS.accent}
                  />
                  <Text style={styles.phoneText}>{profile.phone}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Sécurité 2FA (Uniquement si c'est notre profil) */}
        {isOwn && (
          <View style={styles.sectionCard}>
            <View style={styles.securityRow}>
              <View>
                <Text style={styles.securityTitle}>
                  Double authentification (2FA)
                </Text>
                <Text style={styles.securityDesc}>
                  Sécurisez vos accès par email
                </Text>
              </View>
              <Switch
                value={profile.two_fa_enabled}
                onValueChange={toggle2FA}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={
                  profile.two_fa_enabled ? COLORS.text : COLORS.textMuted
                }
              />
            </View>
          </View>
        )}

        {/* Listings Section (Horizontal) */}
        {listings.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitleOutside}>VÉHICULES PROPOSÉS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {listings.map((car: any) => (
                <TouchableOpacity
                  key={car.id}
                  style={styles.carCard}
                  onPress={() =>
                    router.push({
                      pathname: "/cars/[id]",
                      params: { id: car.id },
                    })
                  }
                >
                  <Image
                    source={{ uri: car.images?.[0] }}
                    style={styles.carImage}
                  />
                  <View style={styles.carInfo}>
                    <Text style={styles.carTitle} numberOfLines={1}>
                      {car.title}
                    </Text>
                    <Text style={styles.carPrice}>
                      {car.price_per_day} GNF/j
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { justifyContent: "center", alignItems: "center" },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    padding: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topNavTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: { width: 120, height: 120, position: "relative" },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  avatarText: { fontSize: 40, fontWeight: "900", color: COLORS.accent },
  editIconBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.card,
  },
  identityInfo: { alignItems: "center", marginTop: 15 },
  userName: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  roleText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: COLORS.border,
    alignSelf: "center",
  },

  // Sections
  sectionCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 1,
  },
  sectionTitleOutside: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 1,
    marginLeft: 24,
    marginBottom: 12,
  },
  editBtnText: { color: COLORS.accent, fontSize: 11, fontWeight: "900" },
  bioText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  phoneText: { color: COLORS.text, fontWeight: "700", fontSize: 14 },

  // Form
  form: { gap: 12 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Security
  securityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  securityTitle: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  securityDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  // Listings
  listSection: { marginBottom: 40 },
  horizontalList: { paddingLeft: 20, gap: 16, paddingRight: 20 },
  carCard: {
    width: 160,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  carImage: { width: "160%", height: 100, backgroundColor: COLORS.border },
  carInfo: { padding: 10 },
  carTitle: { color: COLORS.text, fontWeight: "800", fontSize: 12 },
  carPrice: {
    color: COLORS.accent,
    fontWeight: "900",
    fontSize: 11,
    marginTop: 4,
  },
});
