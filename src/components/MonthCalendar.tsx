import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

/** 'YYYY-MM-DD' key in local time (matches dayKey below). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });

/**
 * Compact month grid. Days present in `marked` show a dot; the selected day is
 * highlighted. Mon-based weeks.
 */
export function MonthCalendar({
  marked,
  selected,
  onSelect,
}: {
  marked: Set<string>;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.y, view.m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    const m = view.m + delta;
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });
  };
  const todayKey = dayKey(today);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} accessibilityLabel="Önceki ay" accessibilityRole="button">
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.month}>{monthFmt.format(first)}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={10} accessibilityLabel="Sonraki ay" accessibilityRole="button">
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const key = dayKey(d);
          const has = marked.has(key);
          const isSel = key === selected;
          const isToday = key === todayKey;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              style={styles.cell}
            >
              <View style={[styles.dayBtn, isToday && styles.dayToday, isSel && styles.daySel]}>
                <Text style={[styles.dayText, isSel && styles.daySelText]}>{d.getDate()}</Text>
                {has ? <View style={[styles.dot, isSel && styles.dotSel]} /> : <View style={styles.dotSpace} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  month: { ...typography.bodyStrong, color: colors.text, textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekday: { ...typography.micro, color: colors.textFaint, flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayBtn: { width: 38, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayToday: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.gold + '88' },
  daySel: { backgroundColor: colors.gold },
  dayText: { ...typography.caption, color: colors.text },
  daySelText: { color: colors.onGold, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  dotSel: { backgroundColor: colors.onGold },
  dotSpace: { width: 5, height: 5 },
});
