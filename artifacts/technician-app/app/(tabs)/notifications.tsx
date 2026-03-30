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
      <View style={styles.cardLeft}>
        <View style={styles.iconBox}>
          <Feather name="bell" size={16} color={COLORS.sky} />
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
        <View style={styles.footer}>
          {!!item.driverName && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.driverName}</Text>
            </View>
          )}
          <Text style={styles.date}>{date}</Text>
        </View>
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
            <Feather name="bell-off" size={40} color={COLORS.grayDark} />
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
    backgroundColor: COLORS.navy,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.navyCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    padding: 14,
  },
  cardLeft: {},
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.skyMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  cardRight: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: COLORS.grayLight,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.grayDark,
    marginLeft: "auto" as any,
  },
  empty: {
    alignItems: "center",
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
