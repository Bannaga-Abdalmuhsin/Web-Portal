import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "expo-router";
import COLORS from "@/constants/colors";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

function InfoRow({ icon, label, value }: { icon: FeatherIconName; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Feather name={icon} size={15} color={COLORS.navy} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogout = () => {
    const doLogout = async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await logout();
      router.replace("/login");
    };

    if (Platform.OS === "web") {
      doLogout();
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "D";

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? "Driver"}</Text>
        <View style={styles.rolePill}>
          <Feather name="truck" size={12} color={COLORS.navy} />
          <Text style={styles.role}>Field Driver</Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>
        <InfoRow icon="mail" label="Email" value={user?.email ?? "—"} />
        <View style={styles.divider} />
        <InfoRow icon="phone" label="Phone" value={user?.phone ?? "—"} />
        <View style={styles.divider} />
        <InfoRow icon="map-pin" label="Zone" value={user?.zone ?? "—"} />
        <View style={styles.divider} />
        <InfoRow icon="hash" label="Driver ID" value={String(user?.driverId ?? "—")} />
      </View>

      {/* App info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application</Text>
        <InfoRow icon="cpu" label="Platform" value="ACES Managed Services" />
        <View style={styles.divider} />
        <InfoRow icon="truck" label="Module" value="Driver Operations" />
        <View style={styles.divider} />
        <InfoRow icon="info" label="Version" value="1.0.0" />
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
        testID="logout-button"
      >
        <Feather name="log-out" size={17} color={COLORS.rose} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 14,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 22,
    gap: 8,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  name: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.grayMuted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  role: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.navy,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 14,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.grayMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
    maxWidth: "55%",
    textAlign: "right" as const,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: 42,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.roseMuted,
    borderWidth: 1.5,
    borderColor: `${COLORS.rose}30`,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: COLORS.rose,
  },
});
