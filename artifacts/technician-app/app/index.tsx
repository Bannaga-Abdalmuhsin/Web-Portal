import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { View, ActivityIndicator } from "react-native";
import COLORS from "@/constants/colors";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.navy }}>
        <ActivityIndicator color={COLORS.red} size="large" />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
