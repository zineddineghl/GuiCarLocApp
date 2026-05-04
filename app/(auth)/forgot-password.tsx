import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authApi } from "../../services/auth";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) {
      setError("Entrez votre adresse email.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Bouton Retour */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Récupération</Text>

          {sent ? (
            <View style={styles.card}>
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  Si cet email existe, un lien de réinitialisation vous a été
                  envoyé.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace("/(auth)/login")}
              >
                <Text style={styles.primaryBtnText}>RETOUR À LA CONNEXION</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.subtitle}>
                Entrez votre email pour recevoir les instructions de
                réinitialisation.
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADRESSE EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@exemple.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} />
                ) : (
                  <Text style={styles.primaryBtnText}>ENVOYER LE LIEN</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  bg: "#0A0A0A",
  card: "#161616",
  accent: "#FFD700",
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  error: "#FF4444",
  success: "#10B981",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  backBtn: {
    marginTop: Platform.OS === "ios" ? 40 : 20,
    paddingVertical: 10,
  },
  backText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
    letterSpacing: -1,
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
    lineHeight: 22,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accent,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  successBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
});
