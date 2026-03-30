import React, { useState, useCallback, useEffect } from "react";
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
  technicianRemark: string;
  technicianStatus: string;
  reviewedBy: string;
  reviewedAt: string | null;
  createdDate: string | null;
}

const STATUS_OPTIONS = ["Reviewed", "Issue", "Pending"] as const;
type TechStatus = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<TechStatus, { bg: string; text: string; border: string }> = {
  Reviewed: { bg: COLORS.greenMuted, text: COLORS.green, border: `${COLORS.green}44` },
  Issue:    { bg: COLORS.roseMuted,  text: COLORS.rose,  border: `${COLORS.rose}44` },
  Pending:  { bg: COLORS.amberMuted, text: COLORS.amber, border: `${COLORS.amber}44` },
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

  const [techStatus, setTechStatus] = useState<TechStatus>("Reviewed");
  const [remark, setRemark] = useState("");
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: mission, isLoading, error } = useQuery<Mission>({
    queryKey: ["mission", id],
    queryFn: async () => {
      const res = await apiFetch(`/api/technician/missions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch mission");
      return res.json() as Promise<Mission>;
    },
  });

  useEffect(() => {
    if (mission) {
      if (mission.technicianRemark) setRemark(mission.technicianRemark);
      if (mission.technicianStatus) setTechStatus((mission.technicianStatus as TechStatus) ?? "Reviewed");
    }
  }, [mission?.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/technician/missions/${id}/followup`, {
        method: "PUT",
        body: JSON.stringify({
          technicianRemark: remark,
          technicianStatus: techStatus,
          reviewedBy: user?.name ?? "Technician",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["tech-missions"] });
      queryClient.invalidateQueries({ queryKey: ["mission", id] });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.back();
      }, 1200);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save follow-up. Please try again.");
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
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[mission.technicianStatus as TechStatus]?.bg ?? COLORS.navyCard }]}>
              <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[mission.technicianStatus as TechStatus]?.text ?? COLORS.gray }]}>
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
              <Text style={styles.metaText}>{mission.driverName || mission.assignedDriver || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Fuel readings */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="droplet" size={16} color={COLORS.sky} />
            <Text style={styles.cardTitle}>Fuel Readings</Text>
          </View>
          <FuelBar label="Filled Liters"         value={mission.filledLiters}         max={maxL} color={COLORS.sky} />
          <FuelBar label="Virtual Calculated"     value={mission.virtualCalculated}    max={maxL} color="#818CF8" />
          <FuelBar label="Actual in Tank"         value={mission.actualInTank}         max={maxL} color={COLORS.green} />
          <FuelBar label="Qty Added Last Task"    value={mission.quantityAddedLastTask} max={maxL} color={COLORS.amber} />
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

        {/* Previous review */}
        {!!mission.reviewedBy && (
          <View style={[styles.card, styles.reviewCard]}>
            <View style={styles.cardTitleRow}>
              <Feather name="check-circle" size={16} color={COLORS.green} />
              <Text style={[styles.cardTitle, { color: COLORS.green }]}>Previous Review</Text>
            </View>
            <Text style={styles.reviewRemark}>{mission.technicianRemark || "No remark added"}</Text>
            <Text style={styles.reviewMeta}>
              by {mission.reviewedBy}
              {mission.reviewedAt ? ` · ${new Date(mission.reviewedAt).toLocaleString()}` : ""}
            </Text>
          </View>
        )}

        {/* Follow-up form */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="tool" size={16} color={COLORS.red} />
            <Text style={styles.cardTitle}>Follow-up Review</Text>
          </View>

          {/* Status selector */}
          <Text style={styles.fieldLabel}>Review Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => {
              const sc = STATUS_COLORS[s];
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusOption,
                    { borderColor: sc.border, backgroundColor: techStatus === s ? sc.bg : "transparent" },
                  ]}
                  onPress={() => { setTechStatus(s); Haptics.selectionAsync(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusOptionText, { color: techStatus === s ? sc.text : COLORS.gray }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Remark */}
          <Text style={styles.fieldLabel}>Technician Remark</Text>
          <TextInput
            style={styles.textarea}
            value={remark}
            onChangeText={setRemark}
            placeholder="Add your follow-up notes or observations..."
            placeholderTextColor={COLORS.grayDark}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            testID="remark-input"
          />

          {/* Submit */}
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
                <Text style={styles.submitBtnText}>Saved!</Text>
              </>
            ) : (
              <Text style={styles.submitBtnText}>Submit Follow-up</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.gray,
  },
  backBtn: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.navyCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  pageTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    padding: 16,
    gap: 6,
  },
  reviewCard: {
    borderColor: `${COLORS.green}33`,
    backgroundColor: COLORS.greenMuted,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  missionIdBox: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  missionIdText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  siteName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  generator: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  fuelRow: {
    gap: 6,
    marginBottom: 10,
  },
  fuelLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fuelLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
  },
  fuelValue: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  fuelTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  fuelFill: {
    height: 6,
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.navyBorder,
  },
  reviewRemark: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.grayLight,
    lineHeight: 20,
  },
  reviewMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statusOptionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  textarea: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.white,
    minHeight: 120,
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnSaved: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
  },
  submitBtnLoading: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
});
