import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
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

const { width } = Dimensions.get("window");

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
  info: "#3B82F6",
};

// --- Helpers ---
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("fr-FR").format(val || 0) + " GNF";
};

const formatDate = (str: string) => {
  if (!str) return "";
  return new Date(str).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
};

// --- Composants Internes ---
function KpiCard({ icon, label, value, sub, color, iconColor }: any) {
  return (
    <View style={styles.kpiCard}>
      <View
        style={[
          styles.kpiIconBox,
          { backgroundColor: `${iconColor}15`, borderColor: `${iconColor}30` },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.kpiInfo}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue} numberOfLines={1}>
          {value}
        </Text>
        {sub && <Text style={styles.kpiSub}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur dashboard");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );

  const { summary, cars, monthly_revenue, recent_bookings } = data;
  const maxRevenue = Math.max(...monthly_revenue.map((r: any) => r.revenue), 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>TABLEAU DE BORD</Text>
          <Text style={styles.subtitle}>RÉSUMÉ DE VOTRE ACTIVITÉ</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid (2x2) */}
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="cash-outline"
            label="REVENUS TOTAUX"
            value={formatCurrency(summary.total_revenue)}
            sub={`${summary.confirmed_bookings} confirmées`}
            iconColor={COLORS.accent}
          />
          <KpiCard
            icon="calendar-outline"
            label="REVENUS DU MOIS"
            value={formatCurrency(summary.month_revenue)}
            sub="Ce mois-ci"
            iconColor={COLORS.text}
          />
          <KpiCard
            icon="notifications-outline"
            label="EN ATTENTE"
            value={summary.pending_bookings}
            sub={
              summary.pending_bookings > 0
                ? "Action requise"
                : "Tout est à jour"
            }
            iconColor={COLORS.warning}
          />
          <KpiCard
            icon="stats-chart-outline"
            label="OCCUPATION"
            value={`${summary.global_occupancy_rate}%`}
            sub={`${summary.active_cars} véhicules actifs`}
            iconColor={COLORS.info}
          />
        </View>

        {/* Chart Evolution */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ÉVOLUTION DES REVENUS</Text>
          <View style={styles.chartContainer}>
            {monthly_revenue.slice(-5).map((d: any, i: number) => (
              <View key={i} style={styles.chartBarCol}>
                <View style={styles.chartBarWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${Math.max(10, (d.revenue / maxRevenue) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel}>
                  {d.month.split("-")[1]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Car Performance List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PERFORMANCES VÉHICULES</Text>
        </View>

        {cars.map((car: any) => (
          <View key={car.id} style={styles.perfCard}>
            <View style={styles.perfTop}>
              <Text style={styles.perfCarName}>
                {car.title || `${car.brand} ${car.model}`}
              </Text>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingText}>
                  {Number(car.avg_rating || 0).toFixed(1)}
                </Text>
                <Ionicons name="star" size={12} color={COLORS.accent} />
              </View>
            </View>

            <View style={styles.perfStatsRow}>
              <View style={styles.perfStat}>
                <Text style={styles.perfStatLabel}>REVENUS</Text>
                <Text style={styles.perfStatValue}>
                  {formatCurrency(car.revenue)}
                </Text>
              </View>
              <View style={styles.perfStat}>
                <Text style={styles.perfStatLabel}>RÉS.</Text>
                <Text style={styles.perfStatValue}>{car.booking_count}</Text>
              </View>
              <View style={styles.perfStat}>
                <Text style={styles.perfStatLabel}>OCCUP.</Text>
                <Text style={styles.perfStatValue}>{car.occupancy_rate}%</Text>
              </View>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${car.occupancy_rate}%` },
                ]}
              />
            </View>
          </View>
        ))}

        {/* Recent Activity */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>ACTIVITÉ RÉCENTE</Text>
        </View>

        <View style={styles.recentContainer}>
          {recent_bookings.map((b: any) => (
            <View key={b.id} style={styles.recentItem}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentCar}>{b.car_title}</Text>
                <Text style={styles.recentRenter}>{b.renter_name}</Text>
              </View>
              <View style={styles.recentRight}>
                <Text style={styles.recentPrice}>
                  {formatCurrency(b.total_price)}
                </Text>
                <Text style={styles.recentDates}>
                  {formatDate(b.start_date)} - {formatDate(b.end_date)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  subtitle: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "700",
    letterSpacing: 1,
  },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // KPI Grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  kpiInfo: {},
  kpiLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "800",
    marginBottom: 4,
  },
  kpiValue: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  kpiSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },

  // Chart
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 1,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingTop: 10,
  },
  chartBarCol: { alignItems: "center", flex: 1 },
  chartBarWrapper: {
    height: 80,
    width: 30,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBar: { width: "100%", backgroundColor: COLORS.accent, borderRadius: 8 },
  chartBarLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: "700",
  },

  // Performance Cards
  sectionHeader: { marginBottom: 12, paddingHorizontal: 4 },
  perfCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  perfTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  perfCarName: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 11, fontWeight: "900", color: COLORS.text },
  perfStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  perfStat: { flex: 1 },
  perfStatLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: "800",
    marginBottom: 2,
  },
  perfStatValue: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  progressBarBg: {
    height: 4,
    backgroundColor: "#000",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: COLORS.accent },

  // Recent Activity
  recentContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentLeft: { flex: 1 },
  recentCar: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  recentRenter: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  recentRight: { alignItems: "flex-end" },
  recentPrice: { fontSize: 13, fontWeight: "900", color: COLORS.accent },
  recentDates: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
});
