import { apiFetch } from "./api";

/**
 * Attempt to register the device's Expo push token with the server.
 * Silently no-ops on web or when expo-notifications is not installed
 * (e.g. in Expo Go dev builds). In a production EAS native build, add
 * expo-notifications to the dependencies and this function will work
 * automatically.
 */
export async function registerPushToken(technicianId: number): Promise<void> {
  try {
    const { Platform } = await import("react-native");
    if (Platform.OS === "web") return;

    const Notifications = await import("expo-notifications");

    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync();

    await apiFetch(`/api/technicians/${technicianId}/fcm-token`, {
      method: "PUT",
      body: JSON.stringify({ token: tokenData.data }),
    });
  } catch {
    // expo-notifications not available in this environment (Expo Go / web).
    // No-op: push token registration requires a native EAS build.
  }
}
