import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Thin haptics wrapper. No-ops on web (and silently swallows any failure so a
 * missing taptic engine never interrupts a user flow).
 */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export function tapLight() {
  if (!enabled) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapMedium() {
  if (!enabled) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function notifySuccess() {
  if (!enabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function notifyError() {
  if (!enabled) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

export function selection() {
  if (!enabled) return;
  void Haptics.selectionAsync().catch(() => {});
}
