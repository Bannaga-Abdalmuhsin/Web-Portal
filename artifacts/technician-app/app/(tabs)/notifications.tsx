import React from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { apiFetch } from "@/lib/api";
import COLORS from "@/constants/colors";

interface Notification {
  id: number;
  title: string;
  message: string;
  driverName?: string;
  sentBy: string;
  createdAt: string;
}

function NotifCard({ item }: { item: Notification }) {
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Feather name="bell" size={16} color={COLORS.sky} />
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardTopRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
        {!!item.driverName && (
          <View style={styles.tag}>
            <Feather name="user" size={10} color={COLORS.textSecondary} />
            <Text style={styles.tagText}>{item.driverName}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiFetch("/api/notifications");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSub}>{data.length} notifications</Text>
      </View>

      <FlatList
        data={data.slice(0, 30)}
        keyExtractor={(n) => String(n.id)}
        renderItem={({ item }) => <NotifCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.red} />
        }
        scrollEnabled={data.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="bell-off" size={32} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>Notifications will appear here</Text>
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    padding: 14,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.skyMuted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardRight: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
    flex: 1,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: COLORS.grayMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
  },
  empty: {
    alignItems: "center",
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
