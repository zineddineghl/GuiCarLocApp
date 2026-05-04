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
import { authApi, UserRole } from "../../services/auth";

const ROLES: { label: string; value: UserRole }[] = [
  { label: "Locataire", value: "renter" },
  { label: "Propriétaire", value: "owner" },
  { label: "Les deux", value: "both" },
];

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("renter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Nom, email et mot de passe sont requis.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role,
      });
      router.push({
        pathname: "/(auth)/verify-email",
        params: { userId: res.userId },
      });
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
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Rejoignez GuiCarLoc</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOM COMPLET *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Mohamed Kamara"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL *</Text>
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
              <Text style={styles.label}>TÉLÉPHONE</Text>
              <TextInput
                style={styles.input}
                placeholder="+224 6XX XX XX XX"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOT DE PASSE *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Minimum 6 caractères"
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
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Selection */}
            <Text style={[styles.label, { marginTop: 8 }]}>VOTRE RÔLE *</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleBtn,
                    role === r.value && styles.roleBtnActive,
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === r.value && styles.roleBtnTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.btnText}>S'INSCRIRE MAINTENANT</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.linkText}>
              Déjà membre ?{" "}
              <Text style={styles.linkTextBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
};

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: "600",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputGroup: {
    marginBottom: 16,
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
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#000",
  },
  roleBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  roleBtnText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  roleBtnTextActive: {
    color: COLORS.accent,
    fontWeight: "800",
  },
  btn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  linkTextBold: {
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
