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
  success: "#10B981",
  warning: "#F59E0B",
  error: "#FF4444",
};

type Reservation = {
  id: number;
  car: { brand: string; model: string; year: number };
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

export default function MesReservationsScreen() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the correct endpoint extracted from your web app: /bookings/my
      const res = await fetch(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du chargement");
      setReservations(data.bookings ?? data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          color: COLORS.success,
          bg: "rgba(16, 185, 129, 0.1)",
          text: "CONFIRMÉE",
        };
      case "cancelled":
        return {
          color: COLORS.error,
          bg: "rgba(255, 68, 68, 0.1)",
          text: "ANNULÉE",
        };
      case "completed":
        return { color: COLORS.textMuted, bg: COLORS.border, text: "TERMINÉE" };
      default:
        return {
          color: COLORS.warning,
          bg: "rgba(245, 158, 11, 0.1)",
          text: "EN ATTENTE",
        };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec bouton Retour */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>RÉSERVATIONS</Text>
          <Text style={styles.subtitle}>Historique de vos locations</Text>
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
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReservations}>
            <Text style={styles.retryText}>RÉESSAYER</Text>
          </TouchableOpacity>
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.emptyTitle}>Aucune réservation</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore loué de véhicule.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(tabs)/voitures")}
          >
            <Text style={styles.actionBtnText}>VOIR LE CATALOGUE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {reservations.map((res) => {
            const statusObj = getStatusStyle(res.status);
            return (
              <View key={res.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.carName}>
                      {res.car?.brand} {res.car?.model}
                    </Text>
                    <Text style={styles.carYear}>{res.car?.year}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: statusObj.bg,
                        borderColor: statusObj.color,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.badgeText, { color: statusObj.color }]}
                    >
                      {statusObj.text}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>DÉPART</Text>
                    <Text style={styles.dateText}>
                      {formatDate(res.start_date)}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={COLORS.textMuted}
                  />
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>RETOUR</Text>
                    <Text style={styles.dateText}>
                      {formatDate(res.end_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.totalLabel}>MONTANT TOTAL</Text>
                  <Text style={styles.totalPrice}>
                    {Number(res.total_price).toLocaleString()} GNF
                  </Text>
                </View>
              </View>
            );
          })}
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
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
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
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: COLORS.bg,
    fontWeight: "900",
    letterSpacing: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
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
    marginBottom: 20,
  },
  cardTitleBox: {
    flex: 1,
  },
  carName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  carYear: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
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
  totalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.accent,
  },
});
