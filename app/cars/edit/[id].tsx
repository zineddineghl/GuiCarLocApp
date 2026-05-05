import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  success: "#10B981",
  error: "#FF4444",
};

const CAR_TYPES = [
  { value: "sedan", label: "Berline", emoji: "🚗" },
  { value: "suv", label: "SUV", emoji: "🚙" },
  { value: "van", label: "Van", emoji: "🚐" },
  { value: "sports", label: "Sport", emoji: "🏎️" },
  { value: "luxury", label: "Luxe", emoji: "🚘" },
  { value: "compact", label: "Compact", emoji: "🚕" },
  { value: "scooter", label: "Scooter", emoji: "🛵" },
  { value: "moto", label: "Moto", emoji: "🏍️" },
  { value: "boat", label: "Bateau", emoji: "🚤" },
];

const TRANSMISSIONS = [
  { value: "auto", label: "Automatique" },
  { value: "manual", label: "Manuelle" },
];
const FUELS = [
  { value: "petrol", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Électrique" },
  { value: "hybrid", label: "Hybride" },
];

type ExistingImage = { uri: string; isRemote: true };
type NewImage = { uri: string; name: string; type: string; isRemote: false };
type AnyImage = ExistingImage | NewImage;

export default function EditCarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [loadingCar, setLoadingCar] = useState(true);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    model: "",
    year: "",
    type: "sedan",
    price_per_day: "",
    weekend_price: "",
    city: "",
    address: "",
    transmission: "auto",
    fuel: "petrol",
    description: "",
    seats: "",
    min_rental_days: "",
    max_rental_days: "",
    requires_deposit: false as boolean,
    deposit_amount: "",
    available: true as boolean,
  });
  const [discounts, setDiscounts] = useState<Array<{ days: string; percentage: string }>>([]);
  const [images, setImages] = useState<AnyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    setLoadingCar(true);
    try {
      const res = await fetch(`${API_URL}/cars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const car = data.car ?? data;
      setForm({
        title: car.title ?? "",
        brand: car.brand ?? "",
        model: car.model ?? "",
        year: car.year ? String(car.year) : "",
        type: car.type ?? "sedan",
        price_per_day: car.price_per_day ? String(car.price_per_day) : "",
        weekend_price: car.weekend_price ? String(car.weekend_price) : "",
        city: car.city ?? "",
        address: car.address ?? "",
        transmission: car.transmission ?? "auto",
        fuel: car.fuel ?? "petrol",
        description: car.description ?? "",
        seats: car.seats ? String(car.seats) : "",
        min_rental_days: car.min_rental_days ? String(car.min_rental_days) : "",
        max_rental_days: car.max_rental_days ? String(car.max_rental_days) : "",
        requires_deposit: Boolean(car.requires_deposit),
        deposit_amount: car.deposit_amount ? String(car.deposit_amount) : "",
        available: car.available === 1 || car.available === true,
      });

      const rawImages = Array.isArray(car.images) ? car.images : [];
      setImages(rawImages.map((uri: string) => ({ uri, isRemote: true as const })));

      if (Array.isArray(car.discounts) && car.discounts.length > 0) {
        setDiscounts(car.discounts.map((d: any) => ({
          days: String(d.days ?? d.min_days ?? ""),
          percentage: String(d.percentage ?? d.discount ?? ""),
        })));
      }
    } catch {
      Alert.alert("Erreur", "Impossible de charger les données du véhicule.");
      router.back();
    } finally {
      setLoadingCar(false);
    }
  };

  const pickImages = async () => {
    if (images.length >= 8) { Alert.alert("Maximum 8 photos"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImgs: NewImage[] = result.assets.slice(0, 8 - images.length).map((a) => ({
        uri: a.uri,
        name: a.fileName || `photo_${Date.now()}.jpg`,
        type: a.mimeType || "image/jpeg",
        isRemote: false,
      }));
      setImages((prev) => [...prev, ...newImgs]);
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const addDiscount = () => setDiscounts((prev) => [...prev, { days: "", percentage: "" }]);
  const removeDiscount = (i: number) => setDiscounts((prev) => prev.filter((_, idx) => idx !== i));
  const updateDiscount = (i: number, field: string, val: string) =>
    setDiscounts((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: val } : d)));

  const handleSubmit = async () => {
    setError("");
    if (!form.title || !form.brand || !form.model || !form.year || !form.price_per_day || !form.city) {
      setError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, String(val)));
      formData.append("discounts", JSON.stringify(discounts.filter((d) => d.days && d.percentage)));

      // Images existantes (URLs distantes à conserver)
      const existingUrls = images
        .filter((img): img is ExistingImage => img.isRemote)
        .map((img) => img.uri);
      formData.append("existing_images", JSON.stringify(existingUrls));

      // Nouvelles images locales
      images
        .filter((img): img is NewImage => !img.isRemote)
        .forEach((img) => formData.append("images", { uri: img.uri, name: img.name, type: img.type } as any));

      const res = await fetch(`${API_URL}/cars/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");

      Alert.alert("Succès", "Annonce modifiée avec succès !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCar) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>MODIFIER</Text>
          <Text style={styles.subtitle}>Mettez à jour votre annonce</Text>
        </View>
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PHOTOS</Text>
        <View style={styles.photosGrid}>
          {images.map((img, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri: img.uri }} style={styles.photoImg} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => removeImage(i)}>
                <Ionicons name="close-circle" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 8 && (
            <TouchableOpacity style={styles.photoAdd} onPress={pickImages}>
              <Ionicons name="camera-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.photoAddText}>{images.length === 0 ? "Ajouter photos" : "+"}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.photoHint}>{images.length}/8 photos · La première sera la photo principale</Text>
      </View>

      {/* Véhicule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMATIONS DU VÉHICULE</Text>
        <Field label="TITRE DE L'ANNONCE *" value={form.title} onChangeText={(v: string) => set("title", v)} placeholder="ex: Mercedes Classe G 2023 - Conakry" />
        <Field label="MARQUE *" value={form.brand} onChangeText={(v: string) => set("brand", v)} placeholder="ex: Mercedes-Benz" />
        <Field label="MODÈLE *" value={form.model} onChangeText={(v: string) => set("model", v)} placeholder="ex: Classe G" />
        <Field label="ANNÉE *" value={form.year} onChangeText={(v: string) => set("year", v)} placeholder="ex: 2023" keyboardType="number-pad" />
        <Field label="NOMBRE DE SIÈGES" value={form.seats} onChangeText={(v: string) => set("seats", v)} placeholder="ex: 5" keyboardType="number-pad" />

        <Text style={styles.label}>TYPE DE VÉHICULE</Text>
        <View style={styles.typeGrid}>
          {CAR_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, form.type === t.value && styles.typeBtnActive]}
              onPress={() => set("type", t.value)}
            >
              <Text style={styles.typeEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeLabel, form.type === t.value && styles.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>TRANSMISSION</Text>
        <View style={styles.toggleRow}>
          {TRANSMISSIONS.map((t) => (
            <TouchableOpacity key={t.value} style={[styles.toggleBtn, form.transmission === t.value && styles.toggleBtnActive]} onPress={() => set("transmission", t.value)}>
              <Text style={[styles.toggleText, form.transmission === t.value && styles.toggleTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>CARBURANT</Text>
        <View style={styles.toggleRow}>
          {FUELS.map((f) => (
            <TouchableOpacity key={f.value} style={[styles.toggleBtn, form.fuel === f.value && styles.toggleBtnActive]} onPress={() => set("fuel", f.value)}>
              <Text style={[styles.toggleText, form.fuel === f.value && styles.toggleTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Localisation & Tarif */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LOCALISATION ET TARIF</Text>
        <Field label="VILLE *" value={form.city} onChangeText={(v: string) => set("city", v)} placeholder="ex: Conakry" />
        <Field label="ADRESSE (OPTIONNEL)" value={form.address} onChangeText={(v: string) => set("address", v)} placeholder="ex: Quartier Ratoma, Rue KA-028" />
        <Field label="PRIX PAR JOUR (GNF) *" value={form.price_per_day} onChangeText={(v: string) => set("price_per_day", v)} placeholder="ex: 1 500 000" keyboardType="number-pad" />
        <Field label="PRIX WEEK-END (GNF) — laisser vide si identique" value={form.weekend_price} onChangeText={(v: string) => set("weekend_price", v)} placeholder="ex: 2 000 000" keyboardType="number-pad" />
        <View style={styles.rowFields}>
          <View style={{ flex: 1 }}>
            <Field label="DURÉE MIN (JOURS)" value={form.min_rental_days} onChangeText={(v: string) => set("min_rental_days", v)} placeholder="ex: 1" keyboardType="number-pad" />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Field label="DURÉE MAX (JOURS)" value={form.max_rental_days} onChangeText={(v: string) => set("max_rental_days", v)} placeholder="ex: 30" keyboardType="number-pad" />
          </View>
        </View>
      </View>

      {/* Caution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CAUTION</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Exiger une caution</Text>
            <Text style={styles.switchSub}>Montant remboursable à la fin de la location</Text>
          </View>
          <Switch
            value={form.requires_deposit}
            onValueChange={(v) => set("requires_deposit", v)}
            trackColor={{ false: "#333", true: "rgba(255,215,0,0.4)" }}
            thumbColor={form.requires_deposit ? COLORS.accent : "#666"}
          />
        </View>
        {form.requires_deposit && (
          <Field label="MONTANT DE LA CAUTION (GNF)" value={form.deposit_amount} onChangeText={(v: string) => set("deposit_amount", v)} placeholder="ex: 5 000 000" keyboardType="number-pad" />
        )}
      </View>

      {/* Réductions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RÉDUCTIONS AUTOMATIQUES</Text>
        <Text style={styles.discountHint}>Offrez une réduction selon la durée de location</Text>
        {discounts.map((d, i) => (
          <View key={i} style={styles.discountRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>À PARTIR DE (JOURS)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 7"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                value={d.days}
                onChangeText={(v) => updateDiscount(i, "days", v)}
              />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>RÉDUCTION (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 10"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                value={d.percentage}
                onChangeText={(v) => updateDiscount(i, "percentage", v)}
              />
            </View>
            <TouchableOpacity style={styles.discountRemove} onPress={() => removeDiscount(i)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addDiscountBtn} onPress={addDiscount}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.accent} />
          <Text style={styles.addDiscountText}>AJOUTER UNE RÈGLE</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Décrivez votre véhicule..."
          placeholderTextColor={COLORS.textMuted}
          value={form.description}
          onChangeText={(v) => set("description", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Disponibilité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DISPONIBILITÉ</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Disponible à la location</Text>
            <Text style={styles.switchSub}>Désactivez pour masquer temporairement l'annonce</Text>
          </View>
          <Switch
            value={form.available}
            onValueChange={(v) => set("available", v)}
            trackColor={{ false: "#333", true: "rgba(255,215,0,0.4)" }}
            thumbColor={form.available ? COLORS.accent : "#666"}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <View style={styles.btnInner}>
            <Ionicons name="checkmark-sharp" size={20} color={COLORS.bg} />
            <Text style={styles.btnPrimaryText}>ENREGISTRER LES MODIFICATIONS</Text>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.accent, fontSize: 14, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 32 },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.accent, marginTop: 4, fontWeight: "700", letterSpacing: 1 },
  section: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 20, letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: "800", color: COLORS.accent, marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: "#000", borderWidth: 1, borderColor: "#333", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text },
  textarea: { minHeight: 120, paddingTop: 16 },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  photoThumb: { width: 90, height: 90, borderRadius: 12, overflow: "hidden", position: "relative" },
  photoImg: { width: "100%", height: "100%" },
  photoRemove: { position: "absolute", top: 4, right: 4 },
  photoAdd: { width: 90, height: 90, borderRadius: 12, borderWidth: 1, borderColor: "#333", borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#000" },
  photoAddText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700" },
  photoHint: { fontSize: 11, color: COLORS.textMuted },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#333", backgroundColor: "#000", alignItems: "center", minWidth: 70 },
  typeBtnActive: { backgroundColor: "rgba(255, 215, 0, 0.1)", borderColor: COLORS.accent },
  typeEmoji: { fontSize: 20, marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  typeLabelActive: { color: COLORS.accent },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#333", backgroundColor: "#000" },
  toggleBtnActive: { backgroundColor: "rgba(255, 215, 0, 0.1)", borderColor: COLORS.accent },
  toggleText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.accent },
  rowFields: { flexDirection: "row" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  switchLabel: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  switchSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  discountHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },
  discountRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 },
  discountRemove: { paddingBottom: 14, paddingLeft: 10 },
  addDiscountBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: "#333", borderRadius: 12, borderStyle: "dashed", justifyContent: "center" },
  addDiscountText: { fontSize: 12, fontWeight: "800", color: COLORS.accent, letterSpacing: 1 },
  btnPrimary: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, alignItems: "center", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnPrimaryText: { color: COLORS.bg, fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  errorBox: { backgroundColor: "rgba(255, 68, 68, 0.1)", borderWidth: 1, borderColor: COLORS.error, borderRadius: 12, padding: 16, marginBottom: 24 },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: "600", textAlign: "center" },
});
