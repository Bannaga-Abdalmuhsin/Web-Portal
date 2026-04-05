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
  "Canceled":            { label: "Canceled",  bg: COLORS.navyCard,   text: COLORS.gray },
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
  const ms = MISSION_STATUS[mission.missionStatus] ?? { label: mission.missionStatus, bg: COLORS.navyCard, text: COLORS.gray };
  const isNew = mission.missionStatus === "Creation";

  return (
    <TouchableOpacity
      style={[styles.card, isNew && styles.cardNew]}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`mission-card-${mission.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.missionIdBadge}>
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
          <Text style={styles.metaText}>{mission.quantityAddedLastTask ?? 0} L last</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>
          {mission.createdDate ? new Date(mission.createdDate).toLocaleDateString() : "—"}
        </Text>
        <Feather name="chevron-right" size={16} color={COLORS.grayDark} />
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
          <Text style={styles.headerSub}>{data.length} missions · {user?.zone}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.amberMuted }]}>
          <Text style={[styles.statNum, { color: COLORS.amber }]}>{counts.New}</Text>
          <Text style={[styles.statLabel, { color: COLORS.amber }]}>New</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.skyMuted }]}>
          <Text style={[styles.statNum, { color: COLORS.sky }]}>{counts.Finished}</Text>
          <Text style={[styles.statLabel, { color: COLORS.sky }]}>Finished</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.greenMuted }]}>
          <Text style={[styles.statNum, { color: COLORS.green }]}>{counts.Approved}</Text>
          <Text style={[styles.statLabel, { color: COLORS.green }]}>Approved</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={COLORS.gray} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search site or mission ID..."
          placeholderTextColor={COLORS.grayDark}
          testID="search-input"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={COLORS.gray} />
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
            <Feather name="clipboard" size={40} color={COLORS.grayDark} />
            <Text style={styles.emptyTitle}>No missions found</Text>
            <Text style={styles.emptyText}>
              {isLoading ? "Loading..." : "Pull down to refresh"}
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
    backgroundColor: COLORS.navy,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navyCard,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
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
    color: COLORS.white,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.navyCard,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  chipActive: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.gray,
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
    backgroundColor: COLORS.navyCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    padding: 16,
    gap: 6,
  },
  cardNew: {
    borderColor: `${COLORS.amber}44`,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  missionIdBadge: {
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
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
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
    color: COLORS.white,
  },
  generator: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
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
    color: COLORS.gray,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyBorder,
  },
  footerDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.grayDark,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.gray,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.grayDark,
  },
});
