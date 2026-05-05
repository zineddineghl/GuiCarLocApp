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
  const [bookedRanges, setBookedRanges] = useState<Array<{ start_date: string; end_date: string }>>([]);
  const [reviews, setReviews] = useState<Array<{ id: number; car_rating: number; owner_rating: number; comment: string; reviewer_name: string; created_at: string }>>([]);

  useEffect(() => {
    fetchCar();
    fetchBookedRanges();
    fetchReviews();
    if (token) fetchFavStatus();
  }, [id]);

  const fetchBookedRanges = async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/car/${id}/booked-dates`);
      const data = await res.json();
      setBookedRanges(data.ranges || []);
    } catch {}
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/car/${id}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {}
  };

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

  const calcPrice = () => {
    if (!startDate || !endDate || !car) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) || 1;
    if (totalDays <= 0) return null;

    let weekDays = 0, weekendDays = 0;
    const cur = new Date(start);
    for (let i = 0; i < totalDays; i++) {
      const d = cur.getDay();
      if (d === 0 || d === 6) weekendDays++; else weekDays++;
      cur.setDate(cur.getDate() + 1);
    }

    const standardPrice = Number(car.price_per_day);
    const wEPrice = car.weekend_price ? Number(car.weekend_price) : standardPrice;
    const totalWeek = weekDays * standardPrice;
    const totalWeekend = weekendDays * wEPrice;
    const subtotal = totalWeek + totalWeekend;

    let percentage = 0;
    if (car.discounts) {
      const discArray = typeof car.discounts === 'string' ? JSON.parse(car.discounts) : car.discounts;
      if (Array.isArray(discArray) && discArray.length > 0) {
        const sorted = [...discArray].sort((a: any, b: any) => b.days - a.days);
        const rule = sorted.find((r: any) => totalDays >= r.days);
        if (rule) percentage = parseFloat(rule.percentage);
      }
    }

    const discountAmount = (subtotal * percentage) / 100;
    return { totalDays, weekDays, weekendDays, standardPrice, wEPrice, totalWeek, totalWeekend, subtotal, discountAmount, percentage, total: subtotal - discountAmount };
  };

  const sendReport = async (reason: string) => {
    try {
      await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ car_id: Number(id), reason }),
      });
      Alert.alert("Signalement envoyé", "Merci, nous allons examiner cette annonce.");
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer le signalement.");
    }
  };

  const handleBook = async () => {
    if (!token) { router.push("/(auth)/login" as any); return; }
    const priceInfo = calcPrice();
    if (!priceInfo) { Alert.alert("Erreur", "Dates invalides. Format : AAAA-MM-JJ"); return; }
    const days = priceInfo.totalDays;
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
  const priceInfo = calcPrice();
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

          {/* Signaler */}
          {token && !isOwner && (
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() =>
                Alert.alert(
                  "Signaler cette annonce",
                  "Choisissez une raison",
                  [
                    { text: "Contenu inapproprié", onPress: () => sendReport("Contenu inapproprié") },
                    { text: "Fraude / Arnaque", onPress: () => sendReport("Fraude / Arnaque") },
                    { text: "Informations incorrectes", onPress: () => sendReport("Informations incorrectes") },
                    { text: "Autre", onPress: () => sendReport("Autre") },
                    { text: "Annuler", style: "cancel" },
                  ]
                )
              }
            >
              <Ionicons name="flag-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.reportBtnText}>Signaler cette annonce</Text>
            </TouchableOpacity>
          )}

          {/* Avis */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AVIS ({reviews.length})</Text>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{r.reviewer_name}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons key={n} name={n <= r.car_rating ? "star" : "star-outline"} size={14} color={COLORS.accent} />
                    ))}
                    <Text style={styles.reviewRatingNum}>{r.car_rating}/5</Text>
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))}
            </View>
          )}

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
            <ScrollView showsVerticalScrollIndicator={false}>
            <CalendarPicker
              startDate={startDate}
              endDate={endDate}
              bookedRanges={bookedRanges}
              onSelect={(start, end) => { setStartDate(start); setEndDate(end); }}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>MESSAGE (OPTIONNEL)</Text>
            <TextInput
              style={[styles.input, { height: 72, textAlignVertical: "top" }]}
              placeholder="Message au propriétaire..."
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
            />

            {priceInfo && (
              <View style={styles.priceSummary}>
                {priceInfo.weekDays > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>{priceInfo.weekDays} jour(s) semaine × {priceInfo.standardPrice.toLocaleString()} GNF</Text>
                    <Text style={styles.priceRowVal}>{priceInfo.totalWeek.toLocaleString()} GNF</Text>
                  </View>
                )}
                {priceInfo.weekendDays > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>{priceInfo.weekendDays} jour(s) week-end × {priceInfo.wEPrice.toLocaleString()} GNF</Text>
                    <Text style={styles.priceRowVal}>{priceInfo.totalWeekend.toLocaleString()} GNF</Text>
                  </View>
                )}
                {priceInfo.percentage > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceRowLabel, { color: '#10B981' }]}>Réduction {priceInfo.percentage}%</Text>
                    <Text style={[styles.priceRowVal, { color: '#10B981' }]}>-{priceInfo.discountAmount.toLocaleString()} GNF</Text>
                  </View>
                )}
                <View style={[styles.priceRow, styles.priceRowTotal]}>
                  <Text style={styles.priceRowTotalLabel}>TOTAL ({priceInfo.totalDays} jour{priceInfo.totalDays > 1 ? 's' : ''})</Text>
                  <Text style={styles.priceRowTotalVal}>{priceInfo.total.toLocaleString()} GNF</Text>
                </View>
                {car.requires_deposit && car.deposit_amount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>Caution (remboursable)</Text>
                    <Text style={styles.priceRowVal}>{Number(car.deposit_amount).toLocaleString()} GNF</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, (bookingLoading || !priceInfo) && styles.bookBtnDisabled]}
              onPress={handleBook}
              disabled={bookingLoading || !priceInfo}
            >
              {bookingLoading
                ? <ActivityIndicator color={COLORS.bg} />
                : <Text style={styles.confirmBtnText}>CONFIRMER — {priceInfo ? priceInfo.total.toLocaleString() : '0'} GNF</Text>
              }
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function CalendarPicker({
  startDate, endDate, bookedRanges, onSelect,
}: {
  startDate: string;
  endDate: string;
  bookedRanges: Array<{ start_date: string; end_date: string }>;
  onSelect: (start: string, end: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(today);

  const startVal = startDate ? new Date(startDate + "T00:00:00") : null;
  const endVal = endDate ? new Date(endDate + "T00:00:00") : null;

  const calStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const isBooked = (date: Date) =>
    bookedRanges.some((r) => {
      const s = new Date(r.start_date + "T00:00:00");
      const e = new Date(r.end_date + "T00:00:00");
      return !isBefore(date, s) && !isAfter(date, e);
    });

  const isPast = (date: Date) => isBefore(date, today);

  const isInRange = (date: Date) => {
    if (!startVal || !endVal) return false;
    return isAfter(date, startVal) && isBefore(date, endVal);
  };

  const hasBookedInRange = (from: Date, to: Date) =>
    eachDayOfInterval({ start: from, end: to }).some((d) => isBooked(d));

  const handlePress = (day: Date) => {
    if (isPast(day) || isBooked(day)) return;
    const dayStr = format(day, "yyyy-MM-dd");
    if (!startVal || endVal) {
      onSelect(dayStr, "");
    } else if (isBefore(day, startVal) || isSameDay(day, startVal)) {
      onSelect(dayStr, "");
    } else if (hasBookedInRange(startVal, day)) {
      onSelect(dayStr, "");
    } else {
      onSelect(startDate, dayStr);
    }
  };

  const isPrevDisabled = isSameMonth(viewDate, today);
  const monthLabel = format(viewDate, "MMMM yyyy", { locale: fr });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <View>
      {/* Navigation mois */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => { if (!isPrevDisabled) setViewDate(subMonths(viewDate, 1)); }}
          style={{ padding: 8, opacity: isPrevDisabled ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 15 }}>{monthLabelCap}</Text>
        <TouchableOpacity onPress={() => setViewDate(addMonths(viewDate, 1))} style={{ padding: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: "700" }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grille des jours */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {days.map((day) => {
          const other = !isSameMonth(day, viewDate);
          if (other) return <View key={day.toISOString()} style={{ width: "14.28%", height: 40 }} />;

          const booked = isBooked(day);
          const past = isPast(day);
          const isStart = !!(startVal && isSameDay(day, startVal));
          const isEnd = !!(endVal && isSameDay(day, endVal));
          const inRange = isInRange(day);
          const isToday = isSameDay(day, today);
          const disabled = past || booked;

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={{
                width: "14.28%", height: 40,
                alignItems: "center", justifyContent: "center",
                backgroundColor: (isStart || isEnd) ? COLORS.accent : inRange ? "rgba(255,215,0,0.15)" : "transparent",
                borderRadius: 20,
              }}
              onPress={() => handlePress(day)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: (isStart || isEnd || isToday) ? "900" : "500",
                color: (isStart || isEnd) ? COLORS.bg : booked ? "#333" : past ? "#444" : COLORS.text,
                textDecorationLine: booked ? "line-through" : "none",
              }}>
                {format(day, "d")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Affichage dates sélectionnées */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1, backgroundColor: "#000", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: startDate ? COLORS.accent : "#333" }}>
          <Text style={{ fontSize: 9, color: COLORS.accent, fontWeight: "900", marginBottom: 3 }}>DÉPART</Text>
          <Text style={{ fontSize: 13, color: startDate ? COLORS.text : COLORS.textMuted, fontWeight: "600" }}>
            {startDate || "—"}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#000", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: endDate ? COLORS.accent : "#333" }}>
          <Text style={{ fontSize: 9, color: COLORS.accent, fontWeight: "900", marginBottom: 3 }}>RETOUR</Text>
          <Text style={{ fontSize: 13, color: endDate ? COLORS.text : COLORS.textMuted, fontWeight: "600" }}>
            {endDate || "—"}
          </Text>
        </View>
      </View>

      {/* Légende */}
      <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent }} />
          <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Sélectionné</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: "#222" }} />
          <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Indisponible</Text>
        </View>
      </View>
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
    maxHeight: "90%",
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
  priceRowTotal: { borderTopWidth: 1, borderTopColor: "#333", marginTop: 6, paddingTop: 8 },
  priceRowTotalLabel: { fontSize: 13, color: COLORS.text, fontWeight: "800" },
  priceRowTotalVal: { fontSize: 15, color: COLORS.accent, fontWeight: "900" },
  confirmBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 4,
  },
  confirmBtnText: { color: COLORS.bg, fontWeight: "900", fontSize: 14 },

  reportBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, marginBottom: 24,
  },
  reportBtnText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },

  // Reviews
  reviewCard: {
    backgroundColor: "#000", borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reviewerName: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  reviewDate: { fontSize: 11, color: COLORS.textMuted },
  reviewStars: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 6 },
  reviewRatingNum: { fontSize: 11, color: COLORS.textMuted, marginLeft: 4, fontWeight: "700" },
  reviewComment: { fontSize: 13, color: "#D1D5DB", lineHeight: 20 },
});
