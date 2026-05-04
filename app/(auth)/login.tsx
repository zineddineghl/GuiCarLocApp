import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/auth";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      if ("requires_2fa" in res) {
        router.push({
          pathname: "/(auth)/verify-2fa",
          params: { userId: res.userId },
        });
      } else {
        await signIn(res.token, res.user);
        router.replace("/(tabs)");
      }
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
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>GuiCarLoc</Text>
            <Text style={styles.subtitle}></Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={{ fontSize: 18 }}>
                    {showPassword ? "🙈" : "👁"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.loginBtnText}>SE CONNECTER</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <TouchableOpacity
            style={styles.registerFooter}
            onPress={() => router.replace("/(auth)/register")}
          >
            <Text style={styles.registerText}>
              Pas encore de compte ?{" "}
              <Text style={styles.registerTextBold}>Créer un profil</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  bg: "#0A0A0A", // Noir profond
  card: "#161616", // Gris très sombre
  accent: "#FFD700", // Or / Jaune GuiCarLoc
  text: "#FFFFFF",
  textMuted: "#A0A0A0",
  error: "#FF4444",
};

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)", // Effet de reflet doré discret
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -1,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  form: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputGroup: {
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 12,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  loginBtn: {
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
  loginBtnText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  registerFooter: {
    marginTop: 32,
    alignItems: "center",
  },
  registerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  registerTextBold: {
    color: COLORS.accent,
    fontWeight: "700",
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
});
