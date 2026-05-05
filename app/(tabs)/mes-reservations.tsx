import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  warning: "#F59E0B",
  error: "#FF4444",
};

type Booking = {
  id: number;
  car_id: number;
  renter_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  message?: string;
  brand: string;
  model: string;
  year: number;
  city: string;
  car_title: string;
  owner_name?: string;
  owner_phone?: string;
  renter_name?: string;
  renter_phone?: string;
  has_review?: boolean;
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: COLORS.warning, bg: "rgba(245,158,11,0.1)",   label: "EN ATTENTE" },
  confirmed: { color: COLORS.success, bg: "rgba(16,185,129,0.1)",   label: "CONFIRMÉE" },
  rejected:  { color: COLORS.error,   bg: "rgba(255,68,68,0.1)",    label: "REFUSÉE" },
  cancelled: { color: COLORS.error,   bg: "rgba(255,68,68,0.1)",    label: "ANNULÉE" },
  completed: { color: COLORS.textMuted, bg: COLORS.border,           label: "TERMINÉE" },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const isPast = (dateStr: string) => new Date(dateStr) < new Date();

function StarRow({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onRate(n)}>
          <Ionicons name={n <= rating ? "star" : "star-outline"} size={28} color={COLORS.accent} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MesReservationsScreen() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my" | "received">("my");
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [received, setReceived] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [carRating, setCarRating] = useState(0);
  const [ownerRating, setOwnerRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [myRes, recRes] = await Promise.all([
        fetch(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/bookings/received`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [myData, recData] = await Promise.all([myRes.json(), recRes.json()]);
      setMyBookings(myData.bookings ?? []);
      setReceived(recData.bookings ?? []);
    } catch {
      setMyBookings([]);
      setReceived([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId: number, status: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await fetchAll();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAction = (bookingId: number, status: string, label: string) => {
    Alert.alert(label, `Confirmer cette action ?`, [
      { text: "Annuler", style: "cancel" },
      { text: label, style: status === "cancelled" || status === "rejected" ? "destructive" : "default", onPress: () => updateStatus(bookingId, status) },
    ]);
  };

  const openReview = (booking: Booking) => {
    setReviewBooking(booking);
    setCarRating(0);
    setOwnerRating(0);
    setReviewComment("");
  };

  const submitReview = async () => {
    if (!reviewBooking) return;
    if (carRating === 0 || ownerRating === 0) {
      Alert.alert("Note requise", "Veuillez noter la voiture et le propriétaire.");
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: reviewBooking.id,
          car_rating: carRating,
          owner_rating: ownerRating,
          comment: reviewComment || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setReviewBooking(null);
      Alert.alert("Merci !", "Votre avis a été publié.");
      fetchAll();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const canReview = (b: Booking) =>
    b.status === "confirmed" && isPast(b.end_date) && !b.has_review;

  const list = activeTab === "my" ? myBookings : received;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>RÉSERVATIONS</Text>
          <Text style={styles.subtitle}>Gérez vos locations</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.tabActive]}
          onPress={() => setActiveTab("my")}
        >
          <Text style={[styles.tabText, activeTab === "my" && styles.tabTextActive]}>
            MES LOCATIONS
          </Text>
          {myBookings.filter((b) => b.status === "pending").length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {myBookings.filter((b) => b.status === "pending").length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "received" && styles.tabActive]}
          onPress={() => setActiveTab("received")}
        >
          <Text style={[styles.tabText, activeTab === "received" && styles.tabTextActive]}>
            REÇUES
          </Text>
          {received.filter((b) => b.status === "pending").length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {received.filter((b) => b.status === "pending").length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === "my" ? "Aucune location" : "Aucune demande reçue"}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === "my"
              ? "Vous n'avez pas encore loué de véhicule."
              : "Vous n'avez pas encore reçu de demande de réservation."}
          </Text>
          {activeTab === "my" && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/voitures")}>
              <Text style={styles.actionBtnText}>VOIR LE CATALOGUE</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {list.map((booking) => {
            const st = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
            const isLoading = actionLoading === booking.id;
            return (
              <View key={booking.id} style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.carName}>{booking.brand} {booking.model}</Text>
                    <Text style={styles.carSub}>{booking.year} · {booking.city}</Text>
                    {activeTab === "my" && booking.owner_name && (
                      <Text style={styles.personName}>Propriétaire : {booking.owner_name}</Text>
                    )}
                    {activeTab === "received" && booking.renter_name && (
                      <Text style={styles.personName}>Locataire : {booking.renter_name}</Text>
                    )}
                  </View>
                  <View style={[styles.badge, { backgroundColor: st.bg, borderColor: st.color }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Dates */}
                <View style={styles.dateRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>DÉPART</Text>
                    <Text style={styles.dateText}>{formatDate(booking.start_date)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
                  <View style={[styles.dateCol, { alignItems: "flex-end" }]}>
                    <Text style={styles.dateLabel}>RETOUR</Text>
                    <Text style={styles.dateText}>{formatDate(booking.end_date)}</Text>
                  </View>
                </View>

                {/* Message */}
                {booking.message ? (
                  <View style={styles.msgBox}>
                    <Ionicons name="chatbubble-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.msgText}>{booking.message}</Text>
                  </View>
                ) : null}

                {/* Prix */}
                <View style={styles.cardFooter}>
                  <Text style={styles.totalLabel}>MONTANT TOTAL</Text>
                  <Text style={styles.totalPrice}>{Number(booking.total_price).toLocaleString()} GNF</Text>
                </View>

                {/* Actions propriétaire */}
                {activeTab === "received" && booking.status === "pending" && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btnConfirm, isLoading && styles.btnDisabled]}
                      disabled={isLoading}
                      onPress={() => confirmAction(booking.id, "confirmed", "Confirmer")}
                    >
                      {isLoading ? <ActivityIndicator size="small" color={COLORS.bg} /> : (
                        <>
                          <Ionicons name="checkmark" size={16} color={COLORS.bg} />
                          <Text style={styles.btnConfirmText}>CONFIRMER</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnReject, isLoading && styles.btnDisabled]}
                      disabled={isLoading}
                      onPress={() => confirmAction(booking.id, "rejected", "Refuser")}
                    >
                      <Ionicons name="close" size={16} color={COLORS.error} />
                      <Text style={styles.btnRejectText}>REFUSER</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action annuler (locataire) */}
                {activeTab === "my" && booking.status === "pending" && (
                  <TouchableOpacity
                    style={[styles.btnCancel, isLoading && styles.btnDisabled]}
                    disabled={isLoading}
                    onPress={() => confirmAction(booking.id, "cancelled", "Annuler")}
                  >
                    {isLoading ? <ActivityIndicator size="small" color={COLORS.error} /> : (
                      <>
                        <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                        <Text style={styles.btnCancelText}>ANNULER LA DEMANDE</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Laisser un avis */}
                {activeTab === "my" && canReview(booking) && (
                  <TouchableOpacity style={styles.btnReview} onPress={() => openReview(booking)}>
                    <Ionicons name="star-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.btnReviewText}>LAISSER UN AVIS</Text>
                  </TouchableOpacity>
                )}

                {activeTab === "my" && booking.has_review && (
                  <View style={styles.reviewedRow}>
                    <Ionicons name="star" size={14} color={COLORS.accent} />
                    <Text style={styles.reviewedText}>Avis publié</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal avis */}
      <Modal visible={!!reviewBooking} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>LAISSER UN AVIS</Text>
            {reviewBooking && (
              <Text style={styles.modalSub}>{reviewBooking.brand} {reviewBooking.model}</Text>
            )}

            <Text style={styles.ratingLabel}>NOTE DE LA VOITURE</Text>
            <StarRow rating={carRating} onRate={setCarRating} />

            <Text style={styles.ratingLabel}>NOTE DU PROPRIÉTAIRE</Text>
            <StarRow rating={ownerRating} onRate={setOwnerRating} />

            <Text style={styles.ratingLabel}>COMMENTAIRE (OPTIONNEL)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={COLORS.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setReviewBooking(null)}
              >
                <Text style={styles.modalCancelText}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, reviewLoading && styles.btnDisabled]}
                onPress={submitReview}
                disabled={reviewLoading}
              >
                {reviewLoading ? (
                  <ActivityIndicator size="small" color={COLORS.bg} />
                ) : (
                  <Text style={styles.modalSubmitText}>PUBLIER</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20, backgroundColor: COLORS.bg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.accent, marginTop: 2, fontWeight: "700", letterSpacing: 1 },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 8,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 1 },
  tabTextActive: { color: COLORS.accent },
  tabBadge: {
    backgroundColor: COLORS.warning, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  tabBadgeText: { fontSize: 10, fontWeight: "900", color: COLORS.bg },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.card,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 22, marginTop: 8, marginBottom: 16 },
  actionBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { color: COLORS.bg, fontWeight: "900", letterSpacing: 1 },

  list: { padding: 20, gap: 16 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  carName: { fontSize: 17, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  carSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },
  personName: { fontSize: 12, color: COLORS.accent, marginTop: 4, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },

  dateRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.bg, padding: 14, borderRadius: 12, marginBottom: 14,
  },
  dateCol: { flex: 1 },
  dateLabel: { fontSize: 9, color: COLORS.accent, fontWeight: "800", marginBottom: 4, letterSpacing: 1 },
  dateText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },

  msgBox: {
    flexDirection: "row", gap: 6, alignItems: "flex-start",
    backgroundColor: "#000", borderRadius: 10, padding: 10, marginBottom: 14,
  },
  msgText: { flex: 1, fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },

  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14,
  },
  totalLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "800", letterSpacing: 0.5 },
  totalPrice: { fontSize: 18, fontWeight: "900", color: COLORS.accent },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  btnConfirm: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: COLORS.success, borderRadius: 12, paddingVertical: 12,
  },
  btnConfirmText: { color: COLORS.bg, fontWeight: "900", fontSize: 12 },
  btnReject: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(255,68,68,0.08)", borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(255,68,68,0.25)",
  },
  btnRejectText: { color: COLORS.error, fontWeight: "900", fontSize: 12 },

  btnCancel: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 12, borderRadius: 12, paddingVertical: 11,
    backgroundColor: "rgba(255,68,68,0.06)", borderWidth: 1, borderColor: "rgba(255,68,68,0.2)",
  },
  btnCancelText: { color: COLORS.error, fontWeight: "800", fontSize: 12 },

  btnReview: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 12, borderRadius: 12, paddingVertical: 11,
    backgroundColor: "rgba(255,215,0,0.08)", borderWidth: 1, borderColor: "rgba(255,215,0,0.25)",
  },
  btnReviewText: { color: COLORS.accent, fontWeight: "800", fontSize: 12 },

  reviewedRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12,
    justifyContent: "center",
  },
  reviewedText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  btnDisabled: { opacity: 0.5 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: Platform.OS === "ios" ? 44 : 28,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text, textAlign: "center", letterSpacing: 1 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 4, marginBottom: 20 },
  ratingLabel: { fontSize: 10, fontWeight: "800", color: COLORS.accent, letterSpacing: 1, textAlign: "center", marginTop: 12 },
  commentInput: {
    backgroundColor: "#000", borderWidth: 1, borderColor: "#333", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: COLORS.text,
    marginTop: 8, minHeight: 90,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancel: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalCancelText: { color: COLORS.textMuted, fontWeight: "800", fontSize: 13 },
  modalSubmit: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  modalSubmitText: { color: COLORS.bg, fontWeight: "900", fontSize: 13 },
});
