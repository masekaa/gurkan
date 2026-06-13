/**
 * Provider-agnostic analytics shim.
 *
 * Screens call `track('event', { ...props })` today; the events are buffered to
 * the console in development and dropped in production. To wire a real provider
 * later (Firebase Analytics, PostHog, Amplitude, Segment, Sentry breadcrumbs),
 * implement `sink` below — no call sites need to change.
 *
 * Kept dependency-free so it never affects bundle size or the web export until a
 * provider is deliberately added.
 */

export type AnalyticsEvent =
  | 'app_open'
  | 'sign_up'
  | 'sign_in'
  | 'business_view'
  | 'booking_start'
  | 'booking_created'
  | 'favorite_toggle'
  | 'review_created'
  | 'search';

type Props = Record<string, string | number | boolean | null | undefined>;

// Swap this for a real provider call when one is configured.
let sink: ((event: AnalyticsEvent, props?: Props) => void) | null = null;

/** Register a real analytics provider. Call once at app startup. */
export function configureAnalytics(fn: (event: AnalyticsEvent, props?: Props) => void) {
  sink = fn;
}

export function track(event: AnalyticsEvent, props?: Props) {
  if (sink) {
    try {
      sink(event, props);
    } catch {
      // Never let analytics break a user flow.
    }
    return;
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
}
