import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
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
  error: "#FF4444",
};

const TRANSMISSIONS = ["Manuelle", "Automatique"];
const FUELS = ["Essence", "Diesel", "Électrique", "Hybride"];

export default function PublierScreen() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    price_per_day: "",
    city: "",
    transmission: "Manuelle",
    fuel_type: "Essence",
    description: "",
    seats: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setError("");
    if (
      !form.brand ||
      !form.model ||
      !form.year ||
      !form.price_per_day ||
      !form.city
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          year: Number(form.year),
          price_per_day: Number(form.price_per_day),
          seats: form.seats ? Number(form.seats) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de la publication");
      setSuccess(true);
      setForm({
        brand: "",
        model: "",
        year: "",
        price_per_day: "",
        city: "",
        transmission: "Manuelle",
        fuel_type: "Essence",
        description: "",
        seats: "",
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-sharp" size={48} color={COLORS.bg} />
        </View>
        <Text style={styles.successTitle}>Annonce publiée</Text>
        <Text style={styles.successText}>
          Votre véhicule d'exception est maintenant visible par notre
          communauté.
        </Text>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => setSuccess(false)}
        >
          <Text style={styles.btnPrimaryText}>PUBLIER UN AUTRE VÉHICULE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>PUBLICATION</Text>
        <Text style={styles.subtitle}>Mettez votre véhicule en location</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Section Véhicule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMATIONS DU VÉHICULE</Text>

        <Field
          label="MARQUE *"
          value={form.brand}
          onChangeText={(v: string) => set("brand", v)}
          placeholder="ex: Mercedes-Benz"
        />
        <Field
          label="MODÈLE *"
          value={form.model}
          onChangeText={(v: string) => set("model", v)}
          placeholder="ex: Classe G"
        />
        <Field
          label="ANNÉE *"
          value={form.year}
          onChangeText={(v: string) => set("year", v)}
          placeholder="ex: 2023"
          keyboardType="number-pad"
        />
        <Field
          label="NOMBRE DE SIÈGES"
          value={form.seats}
          onChangeText={(v: string) => set("seats", v)}
          placeholder="ex: 5"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>TRANSMISSION</Text>
        <View style={styles.toggleRow}>
          {TRANSMISSIONS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.toggleBtn,
                form.transmission === t && styles.toggleBtnActive,
              ]}
              onPress={() => set("transmission", t)}
            >
              <Text
                style={[
                  styles.toggleText,
                  form.transmission === t && styles.toggleTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>CARBURANT</Text>
        <View style={styles.toggleRow}>
          {FUELS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.toggleBtn,
                form.fuel_type === f && styles.toggleBtnActive,
              ]}
              onPress={() => set("fuel_type", f)}
            >
              <Text
                style={[
                  styles.toggleText,
                  form.fuel_type === f && styles.toggleTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section Localisation & Tarif */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LOCALISATION ET TARIF</Text>
        <Field
          label="VILLE *"
          value={form.city}
          onChangeText={(v: string) => set("city", v)}
          placeholder="ex: Conakry"
        />
        <Field
          label="PRIX PAR JOUR (GNF) *"
          value={form.price_per_day}
          onChangeText={(v: string) => set("price_per_day", v)}
          placeholder="ex: 1 500 000"
          keyboardType="number-pad"
        />
      </View>

      {/* Section Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Décrivez votre véhicule, ses options de confort, et vos conditions de location..."
          placeholderTextColor={COLORS.textMuted}
          value={form.description}
          onChangeText={(v) => set("description", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <View style={styles.btnInner}>
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.bg} />
            <Text style={styles.btnPrimaryText}>PUBLIER L'ANNONCE</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
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
    marginBottom: 32,
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
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  formGroup: {
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
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 16,
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#000",
  },
  toggleBtnActive: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderColor: COLORS.accent,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.accent,
  },
  btnPrimary: {
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
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnPrimaryText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    fontWeight: "500",
  },
});
