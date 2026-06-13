import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Notifications layer.
 *
 * LOCAL reminders (appointment reminders) work today on iOS/Android with no
 * server, FCM, or EAS setup — just an OS permission. They no-op on web.
 *
 * REMOTE push (campaigns, owner alerts for new bookings) additionally needs an
 * EAS projectId + FCM/APNs credentials; `registerForPushToken()` returns null
 * until those exist, so call sites stay safe in the meantime.
 */

const native = Platform.OS === 'ios' || Platform.OS === 'android';

let handlerSet = false;
function ensureHandler() {
  if (handlerSet || !native) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerSet = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!native) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/**
 * Schedule a local reminder ahead of an appointment. Returns the notification
 * id (store it to cancel later) or null when skipped (web, no permission, or
 * the reminder time is already in the past).
 */
export async function scheduleAppointmentReminder(input: {
  appointmentId: string;
  businessName: string;
  startIso: string;
  minutesBefore?: number;
}): Promise<string | null> {
  if (!native) return null;
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  ensureHandler();

  const minutesBefore = input.minutesBefore ?? 60;
  const fireAt = new Date(new Date(input.startIso).getTime() - minutesBefore * 60_000);
  const seconds = Math.floor((fireAt.getTime() - readNow()) / 1000);
  if (seconds <= 0) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Randevu hatırlatması',
        body: `${input.businessName} randevun yaklaşıyor.`,
        data: { appointmentId: input.appointmentId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelReminder(notificationId: string): Promise<void> {
  if (!native) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already fired or cancelled — nothing to do.
  }
}

/**
 * Remote push token. Returns null until an EAS projectId + push credentials are
 * configured. Wire `projectId` from expo config when ready.
 */
export async function registerForPushToken(projectId?: string): Promise<string | null> {
  if (!native || !projectId) return null;
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

// Date.now() is intentionally isolated here so the rest of the codebase stays
// pure; only this runtime-timing concern needs the wall clock.
function readNow(): number {
  return new Date().getTime();
}
