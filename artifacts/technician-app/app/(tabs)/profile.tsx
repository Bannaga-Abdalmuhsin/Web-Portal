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
      <Feather name={icon} size={16} color={COLORS.gray} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? "Driver"}</Text>
        <Text style={styles.role}>Field Driver</Text>
      </View>

      {/* Info card */}
      <View style={styles.card}>
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
        <Feather name="log-out" size={18} color={COLORS.rose} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  role: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
  },
  card: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.gray,
    flex: 1,
    marginLeft: 4,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
    maxWidth: "55%",
    textAlign: "right" as const,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.navyBorder,
    marginLeft: 30,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.roseMuted,
    borderWidth: 1,
    borderColor: `${COLORS.rose}44`,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: COLORS.rose,
  },
});
