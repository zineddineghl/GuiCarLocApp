import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
  errorBg: "rgba(255, 68, 68, 0.1)",
};

type Car = {
  id: number;
  title: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  city: string;
  transmission: string;
  fuel_type: string;
};

export default function FavorisScreen() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError("");
    try {
      // ⚠️ Vérifie que c'est la bonne route API pour tes favoris
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const textData = await res.text();

      try {
        const data = JSON.parse(textData);
        if (!res.ok) throw new Error(data.error || "Erreur lors du chargement");

        // PROTECTION ANTI-CRASH : On extrait les données et on vérifie que c'est bien un tableau
        const extractedData = data.favorites || data.data || data;
        setFavorites(Array.isArray(extractedData) ? extractedData : []);
      } catch (e) {
        console.error("Réponse API non-JSON :", textData);
        throw new Error("Erreur serveur. Vérifie l'URL de l'API des favoris.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (carId: number) => {
    // Mise à jour optimiste de l'interface (on retire la carte visuellement tout de suite)
    setFavorites((prev) => prev.filter((car) => car.id !== carId));

    try {
      // ⚠️ Ajuste cette URL pour la suppression d'un favori
      await fetch(`${API_URL}/favorites/${carId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      // Si la suppression échoue côté serveur, on pourrait recharger la liste ici
      console.error("Erreur lors de la suppression du favori", e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FAVORIS</Text>
        <Text style={styles.subtitle}>VOS VÉHICULES SAUVEGARDÉS</Text>
      </View>

      {/* Contenu */}
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
          <TouchableOpacity style={styles.retryBtn} onPress={fetchFavorites}>
            <Text style={styles.retryText}>RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="heart-outline" size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.emptyTitle}>Aucun coup de cœur</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore sauvegardé de véhicules. Parcourez notre
            catalogue pour trouver votre bonheur.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(tabs)/voitures")}
          >
            <Text style={styles.actionBtnText}>EXPLORER LE CATALOGUE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {favorites.map((car) => (
            <TouchableOpacity
              key={car.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/cars/${car.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.carBrand}>
                    {car.brand} {car.model}
                  </Text>
                  <Text style={styles.carYear}>{car.year}</Text>
                </View>

                {/* Bouton pour retirer des favoris */}
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => removeFavorite(car.id)}
                >
                  <Ionicons name="heart" size={24} color={COLORS.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.infoItem}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.infoText}>{car.city || "Guinée"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons
                    name="settings-outline"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.infoText}>
                    {car.transmission || "Manuelle"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons
                    name="flame-outline"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.infoText}>
                    {car.fuel_type || "Essence"}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.price}>
                  {car.price_per_day
                    ? `${Number(car.price_per_day).toLocaleString()} GNF`
                    : "Prix sur demande"}
                  <Text style={styles.perDay}> / jour</Text>
                </Text>
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textMuted}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionBtnText: {
    color: COLORS.bg,
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 13,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: COLORS.errorBg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  retryText: {
    color: COLORS.error,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  list: {
    padding: 24,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitleBox: {
    flex: 1,
    paddingRight: 16,
  },
  carBrand: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  carYear: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  cardInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.accent,
  },
  perDay: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
