import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
  success: "#10B981",
};

type MyCar = {
  id: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  city: string;
  available: boolean;
  total_bookings: number;
};

export default function MesAnnoncesScreen() {
  const { token } = useAuth();
  const [cars, setCars] = useState<MyCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyCars();
  }, []);

  const fetchMyCars = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ URL CORRIGÉE d'après ton code web
      const res = await fetch(`${API_URL}/cars/my/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const textData = await res.text();

      try {
        const data = JSON.parse(textData);
        if (!res.ok) throw new Error(data.error || "Erreur lors du chargement");

        // ✅ On cible spécifiquement data.cars comme dans ton .then(res => setCars(res.data.cars))
        setCars(Array.isArray(data.cars) ? data.cars : []);
      } catch (e) {
        console.error("Erreur parsing JSON. Réponse brute :", textData);
        throw new Error("Le serveur a renvoyé une réponse invalide.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (carId: number, title: string) => {
    Alert.alert(
      "Supprimer l'annonce",
      `Voulez-vous vraiment supprimer "${title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteCar(carId),
        },
      ],
    );
  };

  const deleteCar = async (carId: number) => {
    setCars((prev) => prev.filter((c) => c.id !== carId));
    try {
      await fetch(`${API_URL}/cars/${carId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      fetchMyCars(); // Recharger en cas d'échec
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>MES ANNONCES</Text>
          <Text style={styles.subtitle}>
            {cars.length} véhicule(s) publié(s)
          </Text>
        </View>
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
          <TouchableOpacity style={styles.retryBtn} onPress={fetchMyCars}>
            <Text style={styles.retryText}>RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      ) : cars.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="car-sport-outline" size={64} color={COLORS.card} />
          <Text style={styles.emptyTitle}>Aucune annonce</Text>
          <Text style={styles.emptyText}>
            Commencez à générer des revenus dès maintenant.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(tabs)/publier")}
          >
            <Text style={styles.actionBtnText}>AJOUTER UN VÉHICULE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {cars.map((car) => (
            <View key={car.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carTitle} numberOfLines={1}>
                    {car.title}
                  </Text>
                  <Text style={styles.carDetails}>
                    {car.brand} {car.model} ({car.year})
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-sharp"
                      size={12}
                      color={COLORS.accent}
                    />
                    <Text style={styles.locationText}>{car.city}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: car.available
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(255, 68, 68, 0.1)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: car.available ? COLORS.success : COLORS.error },
                    ]}
                  >
                    {car.available ? "ACTIF" : "INACTIF"}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>TARIF</Text>
                  <Text style={styles.statValue}>
                    {Number(car.price_per_day).toLocaleString()}{" "}
                    <Text style={{ fontSize: 10 }}>GNF/j</Text>
                  </Text>
                </View>
                <View style={styles.statBorder} />
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>RÉSERVATIONS</Text>
                  <Text style={styles.statValue}>
                    {car.total_bookings || 0}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    Alert.alert(
                      "Édition",
                      "Fonctionnalité en cours de développement",
                    )
                  }
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.bg} />
                  <Text style={styles.editBtnText}>MODIFIER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmDelete(car.id, car.title)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  retryText: { color: COLORS.error, fontWeight: "800" },
  list: { padding: 24, gap: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },
  carDetails: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  locationText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    height: 24,
  },
  statusText: { fontSize: 9, fontWeight: "900" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statBorder: { width: 1, height: "100%", backgroundColor: COLORS.border },
  statLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "800",
    marginBottom: 4,
  },
  statValue: { fontSize: 14, color: COLORS.text, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 10 },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editBtnText: { color: COLORS.bg, fontWeight: "900", fontSize: 13 },
  deleteBtn: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 68, 68, 0.05)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.2)",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: COLORS.bg, fontWeight: "900" },
});
