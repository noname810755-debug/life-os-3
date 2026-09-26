import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const REMINDER_CHANNEL = "life-os-reminders";
export const DAILY_BRIEFING_ID = "life-os-daily-briefing";

if (Platform.OS === "android") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function configureNotifications(): Promise<{ granted: boolean; status: string }> {
  if (Platform.OS !== "android") return { granted: false, status: "unsupported" };

  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: "Life OS reminders",
      description: "Private reminders scheduled on this device",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF5E00",
      sound: "default",
    });

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return { granted: true, status: current.status };
    const requested = await Notifications.requestPermissionsAsync();
    return { granted: requested.granted, status: requested.status };
  } catch (error) {
    console.warn("[notifications] permission setup failed", error);
    return { granted: false, status: "error" };
  }
}

export async function getNotificationStatus(): Promise<{ granted: boolean; status: string }> {
  if (Platform.OS !== "android") return { granted: false, status: "unsupported" };
  try {
    const permission = await Notifications.getPermissionsAsync();
    return { granted: permission.granted, status: permission.status };
  } catch (error) {
    console.warn("[notifications] status check failed", error);
    return { granted: false, status: "error" };
  }
}

export async function scheduleDailyBriefing(): Promise<string> {
  const permission = await configureNotifications();
  if (!permission.granted) throw new Error("Notifications are disabled in Android settings.");

  await Notifications.cancelScheduledNotificationAsync(DAILY_BRIEFING_ID).catch(() => undefined);
  return Notifications.scheduleNotificationAsync({
    identifier: DAILY_BRIEFING_ID,
    content: {
      title: "Your daily briefing is ready",
      body: "Open Life OS to see your schedule, tasks, and priorities.",
      sound: "default",
      data: { route: "/" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
      channelId: REMINDER_CHANNEL,
    },
  });
}

export async function cancelDailyBriefing(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_BRIEFING_ID).catch(() => undefined);
}

export async function scheduleTestNotification(): Promise<string> {
  const permission = await configureNotifications();
  if (!permission.granted) throw new Error("Notifications are disabled in Android settings.");
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Life OS test reminder",
      body: "Local notifications are working on this device.",
      sound: "default",
      data: { route: "/notifications" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      repeats: false,
      channelId: REMINDER_CHANNEL,
    },
  });
}

export function notificationRoute(response: Notifications.NotificationResponse | null): string | null {
  const route = response?.notification.request.content.data?.route;
  return typeof route === "string" ? route : null;
}
