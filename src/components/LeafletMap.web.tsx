import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildLeafletHtml, type LeafletMapProps } from '@/lib/leafletHtml';
import { colors, radius } from '@/theme';

/** Web Leaflet map via a sandboxed iframe (no native WebView dependency). */
export default function LeafletMap({
  center,
  interactive = false,
  showMarker = true,
  onPick,
  height = 200,
  reloadKey = 0,
}: LeafletMapProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(
    () => buildLeafletHtml({ center, interactive, showMarker }),
    [reloadKey, interactive, showMarker],
  );

  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    function handler(ev: MessageEvent) {
      try {
        const d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        if (d && typeof d.lat === 'number' && typeof d.lng === 'number') {
          onPickRef.current?.({ lat: d.lat, lng: d.lng });
        }
      } catch {
        // Ignore unrelated window messages.
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <View style={[styles.wrap, { height }]}>
      <iframe
        key={reloadKey}
        title="harita"
        srcDoc={html}
        style={{ border: 'none', width: '100%', height: '100%' }}
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
});
