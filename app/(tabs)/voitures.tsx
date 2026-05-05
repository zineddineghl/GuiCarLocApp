import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  successBg: "rgba(16, 185, 129, 0.1)",
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
  fuel: string;
  available: number;
  images: string[];
};

export default function VoituresScreen() {
  const { token } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchCars();
    }, [])
  );

  const fetchCars = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/cars`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du chargement");
      setCars(data.cars ?? data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cars.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.brand?.toLowerCase().includes(q) ||
      c.model?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>GuiCarLoc</Text>
        <Text style={styles.subtitle}>SÉLECTION VOITURE</Text>
      </View>

      {/* Barre de recherche Premium */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par marque, ville..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              style={styles.clearBtn}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Chargement des véhicules...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCars}>
            <Text style={styles.retryText}>RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons
                name="car-sport-outline"
                size={64}
                color={COLORS.border}
              />
              <Text style={styles.emptyText}>Aucun véhicule trouvé</Text>
            </View>
          ) : (
            filtered.map((car) => <CarCard key={car.id} car={car} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function CarCard({ car }: { car: Car }) {
  const firstImage = Array.isArray(car.images) ? car.images[0] : null;
  const available = car.available === 1 || (car.available as any) === true;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/cars/${car.id}` as any)}
    >
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="car-sport-outline" size={40} color={COLORS.border} />
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.cardBrand}>{car.brand} {car.model}</Text>
            <Text style={styles.cardYear}>{car.year} · {car.city}</Text>
          </View>
          <View style={[styles.badge, available ? styles.badgeAvail : styles.badgeUnavail]}>
            <Text style={[styles.badgeText, available ? styles.badgeTextAvail : styles.badgeTextUnavail]}>
              {available ? "Dispo" : "Indispo"}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="settings-outline" size={13} color={COLORS.accent} />
            <Text style={styles.infoText}>{car.transmission === 'auto' ? 'Auto' : 'Manuelle'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flame-outline" size={13} color={COLORS.accent} />
            <Text style={styles.infoText}>{car.fuel || "Essence"}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {Number(car.price_per_day).toLocaleString()} GNF
            <Text style={styles.perDay}> / jour</Text>
          </Text>
          <View style={styles.actionIcon}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
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
    letterSpacing: 2,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  list: {
    padding: 24,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardImagePlaceholder: {
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  cardYear: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeAvail: {
    backgroundColor: COLORS.successBg,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeUnavail: {
    backgroundColor: COLORS.errorBg,
    borderColor: "rgba(255, 68, 68, 0.2)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeTextAvail: {
    color: COLORS.success,
  },
  badgeTextUnavail: {
    color: COLORS.error,
  },
  cardInfo: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 10,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    gap: 16,
  },
  loadingText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: 8,
  },
  retryText: {
    color: COLORS.error,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 8,
    fontWeight: "600",
  },
});
