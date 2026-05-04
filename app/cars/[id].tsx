import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
};

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams();
  const { token, user } = useAuth();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [bookingModal, setBookingModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchCar();
    if (token) fetchFavStatus();
  }, [id]);

  const fetchCar = async () => {
    try {
      const res = await fetch(`${API_URL}/cars/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) setCar(data.car);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const favs = data.favorites ?? data.cars ?? data;
      if (Array.isArray(favs)) setIsFav(favs.some((f: any) => f.id === Number(id)));
    } catch {}
  };

  const toggleFav = async () => {
    if (!token) { router.push("/(auth)/login" as any); return; }
    const newFav = !isFav;
    setIsFav(newFav);
    try {
      await fetch(`${API_URL}/favorites/${id}`, {
        method: newFav ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { setIsFav(!newFav); }
  };

  const calcDays = () => {
    const s = new Date(startDate), e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const d = Math.ceil((e.getTime() - s.getTime()) / 86400000);
    return d > 0 ? d : 0;
  };

  const handleBook = async () => {
    if (!token) { router.push("/(auth)/login" as any); return; }
    const days = calcDays();
    if (days <= 0) { Alert.alert("Erreur", "Dates invalides. Format : AAAA-MM-JJ"); return; }
    setBookingLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ car_id: Number(id), start_date: startDate, end_date: endDate, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "identity_not_verified") {
          Alert.alert("Identité requise", "Vous devez vérifier votre identité pour réserver. Allez dans Profil > Sécurité.");
        } else {
          Alert.alert("Erreur", data.error || "Erreur lors de la réservation");
        }
        return;
      }
      setBookingModal(false);
      setStartDate(""); setEndDate(""); setMessage("");
      Alert.alert("Demande envoyée", "Le propriétaire va examiner votre demande.");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="car-sport-outline" size={64} color={COLORS.border} />
        <Text style={{ color: COLORS.textMuted, marginTop: 16 }}>Véhicule introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.accent }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images: string[] = Array.isArray(car.images) && car.images.length > 0 ? car.images : [];
  const days = calcDays();
  const total = days * Number(car.price_per_day);
  const available = car.available === 1 || car.available === true;
  const isOwner = user?.id === car.owner_id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Carousel d'images */}
        <View style={styles.imageBox}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / width))}
              scrollEventThrottle={16}
            >
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="car-sport-outline" size={80} color={COLORS.border} />
            </View>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          {token && (
            <TouchableOpacity style={styles.favBtn} onPress={toggleFav}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? COLORS.accent : COLORS.text} />
            </TouchableOpacity>
          )}

          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentImage && styles.dotActive]} />
              ))}
            </View>
          )}

          {!available && (
            <View style={styles.unavailOverlay}>
              <Text style={styles.unavailText}>INDISPONIBLE</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Titre + prix */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.brand}>{car.brand} {car.model}</Text>
              <Text style={styles.yearCity}>{car.year} · {car.city}</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.price}>{Number(car.price_per_day).toLocaleString()}</Text>
              <Text style={styles.priceLabel}>GNF/jour</Text>
            </View>
          </View>

          {/* Note */}
          {car.avg_car_rating && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={COLORS.accent} />
              <Text style={styles.ratingNum}>{car.avg_car_rating}</Text>
              <Text style={styles.ratingCount}>({car.review_count} avis)</Text>
            </View>
          )}

          {/* Specs */}
          <View style={styles.specsGrid}>
            <SpecItem icon="settings-outline" label="Transmission" value={car.transmission === 'auto' ? 'Automatique' : 'Manuelle'} />
            <SpecItem icon="flame-outline" label="Carburant" value={car.fuel || '—'} />
            <SpecItem icon="people-outline" label="Sièges" value={`${car.seats || 5} places`} />
            <SpecItem icon="location-outline" label="Ville" value={car.city || '—'} />
          </View>

          {/* Description */}
          {car.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DESCRIPTION</Text>
              <Text style={styles.descText}>{car.description}</Text>
            </View>
          ) : null}

          {/* Caution */}
          {car.requires_deposit && car.deposit_amount > 0 && (
            <View style={styles.depositBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.accent} />
              <Text style={styles.depositText}>Caution requise : {Number(car.deposit_amount).toLocaleString()} GNF</Text>
            </View>
          )}

          {/* Propriétaire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROPRIÉTAIRE</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                {car.owner_avatar ? (
                  <Image source={{ uri: car.owner_avatar }} style={styles.ownerAvatarImg} />
                ) : (
                  <Text style={styles.ownerAvatarText}>{car.owner_name?.charAt(0).toUpperCase() ?? '?'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{car.owner_name}</Text>
                {car.owner_id_status === 'verified' ? (
                  <Text style={styles.verifiedBadge}>✓ Identité vérifiée</Text>
                ) : (
                  <Text style={styles.unverifiedBadge}>Non vérifié</Text>
                )}
              </View>
              {token && !isOwner && (
                <TouchableOpacity
                  style={styles.msgBtn}
                  onPress={() => router.push(`/messages/${car.owner_id}` as any)}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={COLORS.bg} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Footer fixe */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>{Number(car.price_per_day).toLocaleString()} GNF</Text>
          <Text style={styles.footerPriceLabel}>par jour</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, (!available || isOwner) && styles.bookBtnDisabled]}
          onPress={() => available && !isOwner && setBookingModal(true)}
          disabled={!available || isOwner}
        >
          <Text style={styles.bookBtnText}>
            {isOwner ? "VOTRE ANNONCE" : available ? "RÉSERVER" : "INDISPONIBLE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal réservation */}
      <Modal visible={bookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RÉSERVATION</Text>
              <TouchableOpacity onPress={() => setBookingModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{car.brand} {car.model} · {car.year}</Text>

            <Text style={styles.fieldLabel}>DATE DE DÉBUT (AAAA-MM-JJ)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 2025-06-01"
              placeholderTextColor={COLORS.textMuted}
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.fieldLabel}>DATE DE FIN (AAAA-MM-JJ)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: 2025-06-05"
              placeholderTextColor={COLORS.textMuted}
              value={endDate}
              onChangeText={setEndDate}
            />

            <Text style={styles.fieldLabel}>MESSAGE (OPTIONNEL)</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: "top" }]}
              placeholder="Message au propriétaire..."
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />

            {days > 0 && (
              <View style={styles.priceSummary}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceRowLabel}>{days} jour(s) × {Number(car.price_per_day).toLocaleString()} GNF</Text>
                  <Text style={styles.priceRowVal}>{total.toLocaleString()} GNF</Text>
                </View>
                {car.requires_deposit && car.deposit_amount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>Caution</Text>
                    <Text style={styles.priceRowVal}>{Number(car.deposit_amount).toLocaleString()} GNF</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, (bookingLoading || days <= 0) && styles.bookBtnDisabled]}
              onPress={handleBook}
              disabled={bookingLoading || days <= 0}
            >
              {bookingLoading
                ? <ActivityIndicator color={COLORS.bg} />
                : <Text style={styles.confirmBtnText}>CONFIRMER LA DEMANDE</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SpecItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.specItem}>
      <Ionicons name={icon} size={20} color={COLORS.accent} />
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Image carousel
  imageBox: { height: 280, position: "relative" },
  image: { width, height: 280 },
  imagePlaceholder: { backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  backBtn: {
    position: "absolute", top: Platform.OS === "ios" ? 52 : 32, left: 16,
    backgroundColor: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 12,
  },
  favBtn: {
    position: "absolute", top: Platform.OS === "ios" ? 52 : 32, right: 16,
    backgroundColor: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 12,
  },
  dots: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: COLORS.accent, width: 18 },
  unavailOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.6)", paddingVertical: 8, alignItems: "center",
  },
  unavailText: { color: COLORS.error, fontWeight: "900", letterSpacing: 2 },

  // Content
  content: { padding: 20 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  brand: { fontSize: 24, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  yearCity: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: "500" },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 22, fontWeight: "900", color: COLORS.accent },
  priceLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  ratingNum: { fontSize: 16, fontWeight: "800", color: COLORS.accent },
  ratingCount: { fontSize: 13, color: COLORS.textMuted },

  // Specs grid
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  specItem: {
    flex: 1, minWidth: "45%", backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  specLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", textTransform: "uppercase" },
  specValue: { fontSize: 13, color: COLORS.text, fontWeight: "700", textAlign: "center" },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: COLORS.accent, letterSpacing: 1.5, marginBottom: 12 },
  descText: { fontSize: 14, color: "#D1D5DB", lineHeight: 22 },

  depositBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,215,0,0.06)", borderRadius: 12,
    padding: 14, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,215,0,0.15)",
  },
  depositText: { fontSize: 13, color: COLORS.accent, fontWeight: "600", flex: 1 },

  // Owner
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  ownerAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,215,0,0.1)",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,215,0,0.3)",
  },
  ownerAvatarImg: { width: "100%", height: "100%" },
  ownerAvatarText: { color: COLORS.accent, fontSize: 22, fontWeight: "800" },
  ownerName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  verifiedBadge: { fontSize: 11, color: COLORS.success, fontWeight: "700", marginTop: 2 },
  unverifiedBadge: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginTop: 2 },
  msgBtn: {
    backgroundColor: COLORS.accent, width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },

  // Footer
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 20, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  footerPrice: { fontSize: 18, fontWeight: "900", color: COLORS.accent },
  footerPriceLabel: { fontSize: 11, color: COLORS.textMuted },
  bookBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, alignItems: "center",
  },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { color: COLORS.bg, fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 24,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontWeight: "800", color: COLORS.accent, marginBottom: 6, letterSpacing: 1 },
  input: {
    backgroundColor: "#000", borderWidth: 1, borderColor: "#333",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.text, marginBottom: 14,
  },
  priceSummary: { backgroundColor: "#000", borderRadius: 12, padding: 14, marginBottom: 16 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  priceRowLabel: { fontSize: 13, color: COLORS.textMuted },
  priceRowVal: { fontSize: 13, color: COLORS.accent, fontWeight: "700" },
  confirmBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 4,
  },
  confirmBtnText: { color: COLORS.bg, fontWeight: "900", fontSize: 14 },
});
