import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, elevation, gradients, radius, spacing, typography } from '@/theme';

/** Full-screen container that respects safe areas and the brand background. */
export function Screen({
  children,
  edges = ['top'],
  style,
}: {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const isDisabled = disabled || loading;
  const fg =
    variant === 'primary' ? colors.onGold : variant === 'danger' ? '#fff' : colors.text;

  const inner = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={styles.btnInner}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.btnLabel, { color: fg }]}>{label}</Text>
    </View>
  );

  // Primary uses a gold gradient fill with a soft gold glow; others stay flat.
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: !!loading }}
        style={({ pressed }) => [
          styles.btnGoldWrap,
          !isDisabled && elevation.gold,
          pressed && !isDisabled && styles.btnScaled,
          isDisabled && styles.btnDisabled,
        ]}
      >
        <LinearGradient
          colors={gradients.goldButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btn}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && [styles.btnDanger, !isDisabled && elevation.soft],
        pressed && !isDisabled && styles.btnScaled,
        isDisabled && styles.btnDisabled,
      ]}
    >
      {inner}
    </Pressable>
  );
}

export function Field({
  label,
  icon,
  ...props
}: TextInputProps & { label?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.fieldBox}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.textFaint} style={{ marginRight: spacing.sm }} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={styles.fieldInput}
          {...props}
        />
      </View>
    </View>
  );
}

export function Badge({
  label,
  color = colors.gold,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={42} color={colors.textFaint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.md }}>
          <Button label={actionLabel} icon={actionIcon} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

/** Error placeholder with an optional retry action (for failed queries). */
export function ErrorState({
  title = 'Bir şeyler ters gitti',
  subtitle = 'İçerik yüklenemedi. Lütfen tekrar dene.',
  onRetry,
}: {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name="cloud-offline-outline" size={42} color={colors.danger} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {onRetry ? (
        <View style={{ marginTop: spacing.md }}>
          <Button label="Tekrar Dene" icon="refresh" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/** Decorative round logo/avatar with initials fallback. */
export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

/** Pulsing placeholder block shown while data loads. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius: r = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: useNative }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: colors.surfaceAlt, opacity },
        style,
      ]}
    />
  );
}

/** Skeleton matching BusinessCard (cover band + body). */
export function BusinessCardSkeleton() {
  return (
    <View style={styles.skelCard}>
      <Skeleton width="100%" height={92} radius={0} />
      <View style={styles.skelBody}>
        <Skeleton width={48} height={48} radius={radius.md} style={{ marginTop: -34 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} />
        </View>
      </View>
    </View>
  );
}

/** Generic card-row skeleton for appointment / loyalty lists. */
export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <View style={styles.skelRow}>
      <Skeleton width={48} height={48} radius={radius.md} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="55%" height={14} />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '35%' : '70%'} height={11} />
        ))}
      </View>
    </View>
  );
}

/** Renders `count` placeholder cards while a list loads. */
export function ListSkeleton({
  count = 4,
  kind = 'card',
}: {
  count?: number;
  kind?: 'business' | 'card';
}) {
  return (
    <View style={{ gap: spacing.md, padding: spacing.lg }}>
      {Array.from({ length: count }).map((_, i) =>
        kind === 'business' ? (
          <BusinessCardSkeleton key={i} />
        ) : (
          <CardSkeleton key={i} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  skelCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  skelBody: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'center' },
  skelRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...elevation.soft,
  },
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnGoldWrap: { borderRadius: radius.md },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btnSecondary: { backgroundColor: colors.surfaceAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  btnGhost: { backgroundColor: 'transparent' },
  btnDanger: { backgroundColor: colors.danger },
  btnScaled: { transform: [{ scale: 0.97 }], opacity: 0.95 },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { ...typography.bodyStrong, color: colors.text },
  fieldWrap: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  fieldInput: { flex: 1, color: colors.text, ...typography.body, height: '100%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { ...typography.micro },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.heading, color: colors.text },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.heading, color: colors.text, marginTop: spacing.sm },
  emptySub: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  avatar: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold + '66',
  },
  avatarText: { color: colors.gold, fontWeight: '700' },
});
