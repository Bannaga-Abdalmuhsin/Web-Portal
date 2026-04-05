import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth";
import { apiFetch } from "@/lib/api";
import COLORS from "@/constants/colors";

interface Mission {
  id: number;
  missionId: string;
  siteName: string;
  generator: string;
  project: string;
  driverName: string;
  assignedDriver: string;
  city: string;
  filledLiters: number;
  virtualCalculated: number;
  actualInTank: number;
  quantityAddedLastTask: number;
  notes: string;
  missionStatus: string;
  createdBy: string;
  createdDate: string | null;
}

const STATUS_OPTIONS = ["Finished by Driver", "Reported by driver"] as const;
type MissionAction = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<MissionAction, { bg: string; text: string; border: string }> = {
  "Finished by Driver":  { bg: COLORS.skyMuted,  text: COLORS.sky,  border: `${COLORS.sky}44` },
  "Reported by driver":  { bg: COLORS.roseMuted, text: COLORS.rose, border: `${COLORS.rose}44` },
};

const MISSION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Creation":           { bg: COLORS.amberMuted, text: COLORS.amber },
  "Finished by Driver": { bg: COLORS.skyMuted,   text: COLORS.sky },
  "Task approved":      { bg: COLORS.greenMuted, text: COLORS.green },
  "Reported by driver": { bg: COLORS.roseMuted,  text: COLORS.rose },
  "Canceled":           { bg: COLORS.navyCard,   text: COLORS.gray },
};

function FuelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.fuelRow}>
      <View style={styles.fuelLabelRow}>
        <Text style={styles.fuelLabel}>{label}</Text>
        <Text style={[styles.fuelValue, { color }]}>{value} L</Text>
      </View>
      <View style={styles.fuelTrack}>
        <View style={[styles.fuelFill, { width: `${Math.round(pct)}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedAction, setSelectedAction] = useState<MissionAction>("Finished by Driver");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: mission, isLoading, error } = useQuery<Mission>({
    queryKey: ["driver-mission", id],
    queryFn: async () => {
      const res = await apiFetch(`/api/driver/missions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch mission");
      return res.json() as Promise<Mission>;
    },
  });

  useEffect(() => {
    if (mission?.notes) setNotes(mission.notes);
  }, [mission?.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/driver/missions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          missionStatus: selectedAction,
          notes,
          driverName: user?.name ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["driver-missions"] });
      queryClient.invalidateQueries({ queryKey: ["driver-mission", id] });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.back();
      }, 1200);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update mission. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: topPad }]}>
        <ActivityIndicator color={COLORS.red} size="large" />
        <Text style={styles.loadingText}>Loading mission...</Text>
      </View>
    );
  }

  if (error || !mission) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: topPad }]}>
        <Feather name="alert-circle" size={40} color={COLORS.rose} />
        <Text style={styles.errorText}>Mission not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const maxL = Math.max(mission.filledLiters, mission.virtualCalculated, mission.actualInTank, mission.quantityAddedLastTask, 1);
  const missionColors = MISSION_STATUS_COLORS[mission.missionStatus] ?? { bg: COLORS.navyCard, text: COLORS.gray };
  const canUpdate = mission.missionStatus === "Creation" || mission.missionStatus === "Task approved";

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>Mission Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mission header card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.missionIdBox}>
              <Text style={styles.missionIdText}>{mission.missionId || `MSN-${mission.id}`}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: missionColors.bg }]}>
              <Text style={[styles.statusBadgeText, { color: missionColors.text }]}>
                {mission.missionStatus}
              </Text>
            </View>
          </View>
          <Text style={styles.siteName}>{mission.siteName}</Text>
          <Text style={styles.generator}>{mission.generator} · {mission.project}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={13} color={COLORS.red} />
              <Text style={styles.metaText}>{mission.city || "—"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="user" size={13} color={COLORS.sky} />
              <Text style={styles.metaText}>{mission.driverName || mission.assignedDriver || "Unassigned"}</Text>
            </View>
          </View>
        </View>

        {/* Fuel readings */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="droplet" size={16} color={COLORS.sky} />
            <Text style={styles.cardTitle}>Fuel Readings</Text>
          </View>
          <FuelBar label="Filled Liters"      value={mission.filledLiters}         max={maxL} color={COLORS.sky} />
          <FuelBar label="Virtual Calculated" value={mission.virtualCalculated}    max={maxL} color="#818CF8" />
          <FuelBar label="Actual in Tank"     value={mission.actualInTank}         max={maxL} color={COLORS.green} />
          <FuelBar label="Qty Added Last Task" value={mission.quantityAddedLastTask} max={maxL} color={COLORS.amber} />
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created by</Text>
            <Text style={styles.detailValue}>{mission.createdBy || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {mission.createdDate ? new Date(mission.createdDate).toLocaleDateString() : "—"}
            </Text>
          </View>
          {!!mission.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Driver Notes</Text>
                <Text style={[styles.detailValue, { maxWidth: "65%" }]}>{mission.notes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Driver action form */}
        {canUpdate ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Feather name="truck" size={16} color={COLORS.red} />
              <Text style={styles.cardTitle}>Update Mission</Text>
            </View>

            <Text style={styles.fieldLabel}>Action</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => {
                const sc = STATUS_COLORS[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      { borderColor: sc.border, backgroundColor: selectedAction === s ? sc.bg : "transparent" },
                    ]}
                    onPress={() => { setSelectedAction(s); Haptics.selectionAsync(); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusOptionText, { color: selectedAction === s ? sc.text : COLORS.gray }]}>
                      {s === "Finished by Driver" ? "Finished" : "Report Issue"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={styles.textarea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add fueling notes or observations..."
              placeholderTextColor={COLORS.grayDark}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="remark-input"
            />

            <TouchableOpacity
              style={[styles.submitBtn, saved && styles.submitBtnSaved, mutation.isPending && styles.submitBtnLoading]}
              onPress={() => mutation.mutate()}
              disabled={mutation.isPending || saved}
              activeOpacity={0.85}
              testID="submit-button"
            >
              {mutation.isPending ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : saved ? (
                <>
                  <Feather name="check" size={18} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Updated!</Text>
                </>
              ) : (
                <Text style={styles.submitBtnText}>Submit Update</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { borderColor: `${COLORS.green}33` }]}>
            <View style={styles.cardTitleRow}>
              <Feather name="check-circle" size={16} color={COLORS.green} />
              <Text style={[styles.cardTitle, { color: COLORS.green }]}>Mission Completed</Text>
            </View>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: COLORS.gray }}>
              This mission has been {mission.missionStatus.toLowerCase()} and is no longer editable.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navy },
  loadingRoot: { flex: 1, backgroundColor: COLORS.navy, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: COLORS.gray },
  errorText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: COLORS.gray },
  backBtn: { backgroundColor: COLORS.red, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: COLORS.white },
  topHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.navyCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.navyBorder },
  pageTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: COLORS.white, textAlign: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 14 },
  card: { backgroundColor: COLORS.navyCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.navyBorder, padding: 16, gap: 6 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  missionIdBox: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.navyBorder },
  missionIdText: { fontSize: 11, fontFamily: "Inter_500Medium", color: COLORS.gray, letterSpacing: 0.5 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  siteName: { fontSize: 18, fontFamily: "Inter_700Bold", color: COLORS.white },
  generator: { fontSize: 13, fontFamily: "Inter_400Regular", color: COLORS.gray },
  metaRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", color: COLORS.gray },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: COLORS.white },
  fuelRow: { gap: 6, marginBottom: 10 },
  fuelLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  fuelLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: COLORS.gray },
  fuelValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  fuelTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" },
  fuelFill: { height: 6, borderRadius: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: COLORS.gray },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: COLORS.white, textAlign: "right" },
  divider: { height: 1, backgroundColor: COLORS.navyBorder },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: COLORS.gray, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 8 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statusOption: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  statusOptionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  textarea: { backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: COLORS.navyBorder, borderRadius: 14, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", color: COLORS.white, minHeight: 100, marginBottom: 16 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 54, borderRadius: 16, backgroundColor: COLORS.red, shadowColor: COLORS.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  submitBtnSaved: { backgroundColor: COLORS.green, shadowColor: COLORS.green },
  submitBtnLoading: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: COLORS.white },
});
