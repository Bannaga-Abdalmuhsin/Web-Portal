import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  city: string;
  filledLiters: number;
  virtualCalculated: number;
  actualInTank: number;
  quantityAddedLastTask: number;
  missionStatus: string;
  notes: string;
  createdDate: string | null;
}

const MISSION_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  "Creation":            { label: "New",       bg: COLORS.amberMuted, text: COLORS.amber },
  "Finished by Driver":  { label: "Finished",  bg: COLORS.skyMuted,   text: COLORS.sky },
  "Task approved":       { label: "Approved",  bg: COLORS.greenMuted, text: COLORS.green },
  "Reported by driver":  { label: "Reported",  bg: COLORS.roseMuted,  text: COLORS.rose },
  "Canceled":            { label: "Canceled",  bg: COLORS.grayMuted,  text: COLORS.gray },
};

const FILTER_TABS = ["All", "New", "Finished", "Approved"] as const;
type FilterTab = typeof FILTER_TABS[number];

const FILTER_MAP: Record<FilterTab, string | null> = {
  All: null,
  New: "Creation",
  Finished: "Finished by Driver",
  Approved: "Task approved",
};

function MissionCard({ mission, onPress }: { mission: Mission; onPress: () => void }) {
  const ms = MISSION_STATUS[mission.missionStatus] ?? { label: mission.missionStatus, bg: COLORS.grayMuted, text: COLORS.gray };
  const isNew = mission.missionStatus === "Creation";

  return (
    <TouchableOpacity
      style={[styles.card, isNew && styles.cardNew]}
      onPress={onPress}
      activeOpacity={0.72}
      testID={`mission-card-${mission.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.missionIdBadge}>
          <Feather name="hash" size={10} color={COLORS.gray} />
          <Text style={styles.missionIdText}>{mission.missionId || `MSN-${mission.id}`}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: ms.bg }]}>
          <Text style={[styles.badgeText, { color: ms.text }]}>{ms.label}</Text>
        </View>
      </View>

      <Text style={styles.siteName} numberOfLines={1}>{mission.siteName}</Text>
      <Text style={styles.generator} numberOfLines={1}>{mission.generator} · {mission.project}</Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={COLORS.red} />
          <Text style={styles.metaText}>{mission.city || "—"}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="droplet" size={12} color={COLORS.sky} />
          <Text style={styles.metaText}>{mission.quantityAddedLastTask ?? 0} L last fill</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>
          {mission.createdDate ? new Date(mission.createdDate).toLocaleDateString() : "—"}
        </Text>
        <View style={styles.arrowBtn}>
          <Feather name="chevron-right" size={14} color={COLORS.navy} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const { data = [], isLoading, refetch } = useQuery<Mission[]>({
    queryKey: ["driver-missions", user?.driverId],
    queryFn: async () => {
      const res = await apiFetch(`/api/driver/missions?driverId=${user?.driverId ?? ""}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user?.driverId,
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    return data
      .filter((m) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return m.siteName?.toLowerCase().includes(q) || m.missionId?.toLowerCase().includes(q);
      })
      .filter((m) => {
        const statusFilter = FILTER_MAP[activeTab];
        if (!statusFilter) return true;
        return m.missionStatus === statusFilter;
      });
  }, [data, search, activeTab]);

  const counts = useMemo(() => ({
    New: data.filter((m) => m.missionStatus === "Creation").length,
    Finished: data.filter((m) => m.missionStatus === "Finished by Driver").length,
    Approved: data.filter((m) => m.missionStatus === "Task approved").length,
  }), [data]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Missions</Text>
          <Text style={styles.headerSub}>{data.length} total · {user?.zone}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{counts.New} new</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.amber }]}>
          <Text style={[styles.statNum, { color: COLORS.amber }]}>{counts.New}</Text>
          <Text style={styles.statLabel}>New</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.sky }]}>
          <Text style={[styles.statNum, { color: COLORS.sky }]}>{counts.Finished}</Text>
          <Text style={styles.statLabel}>Finished</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.green }]}>
          <Text style={[styles.statNum, { color: COLORS.green }]}>{counts.Approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={COLORS.gray} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search site or mission ID..."
          placeholderTextColor={COLORS.textMuted}
          testID="search-input"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
            <Feather name="x" size={14} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.chip, activeTab === tab && styles.chipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, activeTab === tab && styles.chipTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <MissionCard
            mission={item}
            onPress={() => router.push(`/mission/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.red} />
        }
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="clipboard" size={32} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No missions found</Text>
            <Text style={styles.emptyText}>
              {isLoading ? "Loading your missions..." : "Pull down to refresh"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: COLORS.redMuted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: COLORS.red,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
  },
  clearBtn: {
    padding: 4,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  chipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    padding: 16,
    gap: 6,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardNew: {
    borderColor: COLORS.amber,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  missionIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.grayMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  missionIdText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  siteName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  generator: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  footerDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  arrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.grayMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
  },
});
