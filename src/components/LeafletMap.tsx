import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { buildLeafletHtml, type LeafletMapProps } from '@/lib/leafletHtml';
import { colors, radius } from '@/theme';

/** Native (iOS/Android) Leaflet map via react-native-webview. */
export default function LeafletMap({
  center,
  interactive = false,
  showMarker = true,
  onPick,
  height = 200,
  reloadKey = 0,
}: LeafletMapProps) {
  // Recomputed only on reloadKey/mode change so live marker drags don't reload.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(
    () => buildLeafletHtml({ center, interactive, showMarker }),
    [reloadKey, interactive, showMarker],
  );

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        key={reloadKey}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        onMessage={(e) => {
          if (!onPick) return;
          try {
            const d = JSON.parse(e.nativeEvent.data);
            if (typeof d?.lat === 'number' && typeof d?.lng === 'number') {
              onPick({ lat: d.lat, lng: d.lng });
            }
          } catch {
            // Ignore non-JSON messages.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  web: { flex: 1, backgroundColor: 'transparent' },
});
