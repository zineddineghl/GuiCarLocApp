import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
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
  success: "#10B981",
  successBg: "rgba(16, 185, 129, 0.1)",
};

export default function SecurityScreen() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePasswordResetRequest = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // ⚠️ Ajuste cette route selon ton backend (ex: /auth/forgot-password)
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Le token n'est pas toujours requis pour un forgot-password, mais on le met par sécurité
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user?.email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        Alert.alert("Erreur", data.message || "Impossible d'envoyer l'email.");
      }
    } catch (error) {
      Alert.alert("Erreur réseau", "Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec bouton Retour */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>SÉCURITÉ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section Mot de passe */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={32} color={COLORS.accent} />
          </View>

          <Text style={styles.cardTitle}>Modifier le mot de passe</Text>
          <Text style={styles.cardDesc}>
            Pour des raisons de sécurité, le changement de mot de passe
            s'effectue via un lien sécurisé envoyé à votre adresse email :
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {success ? (
            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.success}
              />
              <Text style={styles.successText}>
                Email envoyé avec succès ! Veuillez vérifier votre boîte de
                réception et vos spams.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handlePasswordResetRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color={COLORS.bg} />
                  <Text style={styles.actionBtnText}>RECEVOIR LE LIEN</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Espace pour d'autres options futures (ex: 2FA) */}
        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={COLORS.textMuted}
          />
          <Text style={styles.infoText}>
            Votre compte GuiCarLoc bénéficie des standards de sécurité modernes
            pour protéger vos données.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
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
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.accent,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.successBg,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  successText: {
    flex: 1,
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 10,
  },
  infoText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
