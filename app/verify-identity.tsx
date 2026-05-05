import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../constants/api";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  accent: "#FFD700",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  border: "#222222",
  success: "#10B981",
  error: "#FF4444",
  warning: "#F59E0B",
};

type UploadZoneProps = {
  label: string;
  hint: string;
  uri: string | null;
  onPick: () => void;
  onRemove: () => void;
};

function UploadZone({ label, hint, uri, onPick, onRemove }: UploadZoneProps) {
  return (
    <View style={styles.uploadZone}>
      <Text style={styles.uploadLabel}>{label}</Text>
      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Ionicons name="trash-outline" size={14} color={COLORS.error} />
            <Text style={styles.removeBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBtn} onPress={onPick}>
          <Ionicons name="cloud-upload-outline" size={32} color={COLORS.textMuted} />
          <Text style={styles.uploadHint}>{hint}</Text>
          <Text style={styles.uploadMeta}>JPG, PNG — max 10 Mo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function VerifyIdentityScreen() {
  const { user, token, refreshUser } = useAuth();
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const idStatus = success ? "pending" : (user?.id_status ?? "none");

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!front || !back || !selfie) return;
    setLoading(true);

    const toFile = (uri: string, name: string) => {
      const ext = uri.split(".").pop() || "jpg";
      return { uri, name: `${name}.${ext}`, type: `image/${ext}` } as any;
    };

    const formData = new FormData();
    formData.append("id_doc_front", toFile(front, "front"));
    formData.append("id_doc_back", toFile(back, "back"));
    formData.append("id_selfie", toFile(selfie, "selfie"));

    try {
      const res = await fetch(`${API_URL}/users/me/verify-identity`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        setSuccess(true);
      } else {
        Alert.alert("Erreur", data.error || "Échec de l'envoi");
      }
    } catch {
      Alert.alert("Erreur réseau", "Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>VÉRIFICATION</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Vérification d'identité</Text>
        <Text style={styles.subtitle}>
          Pour protéger les propriétaires et les locataires, nous vérifions l'identité avant toute réservation.
        </Text>

        {/* Bannière de statut */}
        {idStatus === "verified" && (
          <View style={[styles.banner, { borderColor: COLORS.success, backgroundColor: "rgba(16,185,129,0.1)" }]}>
            <Ionicons name="shield-checkmark" size={22} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: COLORS.success }]}>Identité vérifiée</Text>
              <Text style={styles.bannerDesc}>Vous pouvez effectuer des réservations sur GuiCarLoc.</Text>
            </View>
          </View>
        )}
        {idStatus === "pending" && (
          <View style={[styles.banner, { borderColor: COLORS.warning, backgroundColor: "rgba(245,158,11,0.1)" }]}>
            <Ionicons name="time" size={22} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: COLORS.warning }]}>Vérification en cours</Text>
              <Text style={styles.bannerDesc}>Vos documents ont été envoyés. Nous les examinons sous 24h.</Text>
            </View>
          </View>
        )}
        {idStatus === "rejected" && (
          <View style={[styles.banner, { borderColor: COLORS.error, backgroundColor: "rgba(255,68,68,0.1)" }]}>
            <Ionicons name="close-circle" size={22} color={COLORS.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: COLORS.error }]}>Vérification refusée</Text>
              {user?.id_rejection_reason && (
                <Text style={styles.bannerDesc}>Motif : {user.id_rejection_reason}</Text>
              )}
              <Text style={styles.bannerDesc}>Veuillez soumettre de nouveaux documents.</Text>
            </View>
          </View>
        )}

        {/* Formulaire — visible si none ou rejected */}
        {(idStatus === "none" || idStatus === "rejected") && (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
              <Text style={styles.infoText}>
                Uploadez votre{" "}
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>CNI guinéenne</Text>
                {" "}(recto + verso) ainsi qu'un{" "}
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>selfie</Text>
                {" "}de vous tenant votre CNI.
              </Text>
            </View>

            <UploadZone
              label="CNI Recto"
              hint="Photo du recto de votre CNI"
              uri={front}
              onPick={() => pickImage(setFront)}
              onRemove={() => setFront(null)}
            />
            <UploadZone
              label="CNI Verso"
              hint="Photo du verso de votre CNI"
              uri={back}
              onPick={() => pickImage(setBack)}
              onRemove={() => setBack(null)}
            />
            <UploadZone
              label="Selfie avec votre CNI"
              hint="Tenez votre CNI visible face à la caméra"
              uri={selfie}
              onPick={() => pickImage(setSelfie)}
              onRemove={() => setSelfie(null)}
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!front || !back || !selfie || loading) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!front || !back || !selfie || loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.bg} />
                : <Text style={styles.submitBtnText}>ENVOYER MES DOCUMENTS</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {/* Ce qu'il faut savoir */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Ce qu'il faut savoir</Text>
          {[
            "La vérification prend en général moins de 24h ouvrables.",
            "Vos documents sont stockés de façon sécurisée sur Cloudinary.",
            "Une fois vérifié, vous pouvez effectuer des réservations illimitées.",
            "En cas de refus, vous pourrez soumettre de nouveaux documents.",
          ].map((item, i) => (
            <View key={i} style={styles.infoCardRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.infoCardText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

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

  content: { padding: 24, paddingBottom: 48, gap: 20 },

  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },

  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerTitle: { fontWeight: "800", fontSize: 14, marginBottom: 2 },
  bannerDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(255,215,0,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },

  uploadZone: { gap: 8 },
  uploadLabel: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  uploadBtn: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  uploadHint: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  uploadMeta: { fontSize: 11, color: "#555" },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: COLORS.border,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  removeBtnText: { fontSize: 12, color: COLORS.error },

  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: COLORS.bg, fontWeight: "900", fontSize: 14, letterSpacing: 1 },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  infoCardTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  infoCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoCardText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
});
