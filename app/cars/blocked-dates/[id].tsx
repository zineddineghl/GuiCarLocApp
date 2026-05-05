import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
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
import { API_URL } from "../../../constants/api";
import { useAuth } from "../../../context/AuthContext";

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

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

type Block = { id: number; start_date: string; end_date: string };

export default function BlockedDatesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Sélection calendrier
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => { fetchBlocks(); }, [id]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cars/${id}/blocked-dates`);
      const data = await res.json();
      setBlocks(data.blocked || []);
    } catch {}
    finally { setLoading(false); }
  };

  const addBlock = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Dates requises", "Sélectionnez une période à bloquer.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/cars/${id}/blocked-dates`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setBlocks((prev) => [...prev, data.block]);
      setStartDate("");
      setEndDate("");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (blockId: number) => {
    Alert.alert("Supprimer le blocage", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setDeletingId(blockId);
          try {
            await fetch(`${API_URL}/cars/${id}/blocked-dates/${blockId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            setBlocks((prev) => prev.filter((b) => b.id !== blockId));
          } catch {}
          finally { setDeletingId(null); }
        },
      },
    ]);
  };

  // Calendrier
  const calStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const isBlocked = (date: Date) =>
    blocks.some((b) => {
      const s = new Date(b.start_date + "T00:00:00");
      const e = new Date(b.end_date + "T00:00:00");
      return !isBefore(date, s) && !isAfter(date, e);
    });

  const isPast = (date: Date) => isBefore(date, today);

  const startVal = startDate ? new Date(startDate + "T00:00:00") : null;
  const endVal = endDate ? new Date(endDate + "T00:00:00") : null;
  const isInRange = (date: Date) => startVal && endVal && isAfter(date, startVal) && isBefore(date, endVal);

  const handleDayPress = (day: Date) => {
    if (isPast(day)) return;
    const dayStr = format(day, "yyyy-MM-dd");
    if (!startVal || endVal) {
      setStartDate(dayStr); setEndDate("");
    } else if (isBefore(day, startVal) || isSameDay(day, startVal)) {
      setStartDate(dayStr); setEndDate("");
    } else {
      setEndDate(dayStr);
    }
  };

  const isPrevDisabled = isSameMonth(viewDate, today);
  const monthLabel = format(viewDate, "MMMM yyyy", { locale: fr });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>DATES BLOQUÉES</Text>
          <Text style={styles.subtitle}>Gérez les créneaux indisponibles</Text>
        </View>
      </View>

      {/* Calendrier de sélection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SÉLECTIONNER UNE PÉRIODE</Text>

        {/* Nav mois */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={[styles.navBtn, isPrevDisabled && { opacity: 0.3 }]}
            onPress={() => { if (!isPrevDisabled) setViewDate(subMonths(viewDate, 1)); }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabelCap}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => setViewDate(addMonths(viewDate, 1))}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Jours semaine */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((d) => (
            <Text key={d} style={styles.dayLabel}>{d}</Text>
          ))}
        </View>

        {/* Grille */}
        <View style={styles.grid}>
          {days.map((day) => {
            if (!isSameMonth(day, viewDate)) {
              return <View key={day.toISOString()} style={styles.dayEmpty} />;
            }
            const blocked = isBlocked(day);
            const past = isPast(day);
            const isStart = !!(startVal && isSameDay(day, startVal));
            const isEnd = !!(endVal && isSameDay(day, endVal));
            const inRange = !!isInRange(day);
            const isToday = isSameDay(day, today);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  blocked && styles.dayCellBlocked,
                  (isStart || isEnd) && styles.dayCellSelected,
                  inRange && styles.dayCellInRange,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={past}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  past && styles.dayTextPast,
                  blocked && styles.dayTextBlocked,
                  (isStart || isEnd) && styles.dayTextSelected,
                  isToday && !isStart && !isEnd && styles.dayTextToday,
                ]}>
                  {format(day, "d")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dates sélectionnées */}
        <View style={styles.selectedRow}>
          <View style={[styles.selectedBox, startDate && styles.selectedBoxActive]}>
            <Text style={styles.selectedLabel}>DÉBUT</Text>
            <Text style={styles.selectedDate}>{startDate || "—"}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
          <View style={[styles.selectedBox, endDate && styles.selectedBoxActive]}>
            <Text style={styles.selectedLabel}>FIN</Text>
            <Text style={styles.selectedDate}>{endDate || "—"}</Text>
          </View>
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.accent }]} />
            <Text style={styles.legendText}>Sélectionné</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "rgba(255,68,68,0.4)" }]} />
            <Text style={styles.legendText}>Déjà bloqué</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.blockBtn, (saving || !startDate || !endDate) && styles.blockBtnDisabled]}
          onPress={addBlock}
          disabled={saving || !startDate || !endDate}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.bg} />
              <Text style={styles.blockBtnText}>BLOQUER CES DATES</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste des blocages existants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PÉRIODES BLOQUÉES ({blocks.length})</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : blocks.length === 0 ? (
          <Text style={styles.emptyText}>Aucune période bloquée.</Text>
        ) : (
          blocks.map((b) => (
            <View key={b.id} style={styles.blockRow}>
              <Ionicons name="lock-closed" size={16} color={COLORS.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.blockDates}>
                  {formatDate(b.start_date)} → {formatDate(b.end_date)}
                </Text>
              </View>
              {deletingId === b.id ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <TouchableOpacity onPress={() => removeBlock(b.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 32 },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.accent, marginTop: 2, fontWeight: "700", letterSpacing: 1 },
  section: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: "900", color: COLORS.accent,
    letterSpacing: 1.5, marginBottom: 20, borderBottomWidth: 1,
    borderBottomColor: COLORS.border, paddingBottom: 12,
  },

  // Calendar
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  dayLabels: { flexDirection: "row", marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 11, color: COLORS.textMuted, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  dayEmpty: { width: "14.28%", height: 44 },
  dayCell: {
    width: "14.28%", height: 44, alignItems: "center", justifyContent: "center",
    borderRadius: 22,
  },
  dayCellBlocked: { backgroundColor: "rgba(255,68,68,0.15)" },
  dayCellSelected: { backgroundColor: COLORS.accent },
  dayCellInRange: { backgroundColor: "rgba(255,215,0,0.15)" },
  dayText: { fontSize: 14, fontWeight: "500", color: COLORS.text },
  dayTextPast: { color: "#444" },
  dayTextBlocked: { color: COLORS.error, textDecorationLine: "line-through" },
  dayTextSelected: { color: COLORS.bg, fontWeight: "900" },
  dayTextToday: { color: COLORS.accent, fontWeight: "800" },

  selectedRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16,
  },
  selectedBox: {
    flex: 1, backgroundColor: "#000", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "#333",
  },
  selectedBoxActive: { borderColor: COLORS.accent },
  selectedLabel: { fontSize: 9, color: COLORS.accent, fontWeight: "900", marginBottom: 3 },
  selectedDate: { fontSize: 13, color: COLORS.text, fontWeight: "600" },

  legend: { flexDirection: "row", gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.textMuted },

  blockBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.error, borderRadius: 12, paddingVertical: 14,
  },
  blockBtnDisabled: { opacity: 0.4 },
  blockBtnText: { color: COLORS.bg, fontWeight: "900", fontSize: 13 },

  // Blocks list
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", paddingVertical: 8 },
  blockRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  blockDates: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  deleteBtn: { padding: 6 },
});
