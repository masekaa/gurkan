import type { LatLng } from './geo';

export type LeafletMapProps = {
  /** Initial map center / marker position. */
  center: LatLng;
  /** When true the user can tap/drag to move the marker (location picker). */
  interactive?: boolean;
  /** Whether to draw a marker at the center initially. */
  showMarker?: boolean;
  /** Fired (interactive only) when the marker is moved. */
  onPick?: (coords: LatLng) => void;
  height?: number;
  /** Bump to force a full reload (e.g. after "use my location"). */
  reloadKey?: number;
};

const LEAFLET_VERSION = '1.9.4';

/**
 * Builds a self-contained Leaflet map page using free OpenStreetMap tiles.
 * Works inside a WebView (native) or an iframe srcDoc (web). The page reports
 * marker moves back through `ReactNativeWebView.postMessage` (native) or
 * `window.parent.postMessage` (web) as a JSON `{lat,lng}` string.
 */
export function buildLeafletHtml(opts: {
  center: LatLng;
  interactive: boolean;
  showMarker: boolean;
}): string {
  const { center, interactive, showMarker } = opts;
  const zoom = showMarker ? 15 : 13;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  #map { background: #eee; }
  .hint {
    position: absolute; z-index: 1000; left: 8px; right: 8px; top: 8px;
    background: rgba(23,17,9,0.82); color: #fff; font: 600 12px/1.3 -apple-system,Segoe UI,Roboto,sans-serif;
    padding: 7px 10px; border-radius: 10px; text-align: center; pointer-events: none;
  }
</style>
</head>
<body>
${interactive ? '<div class="hint">Konumu seçmek için haritaya dokun veya işaretçiyi sürükle</div>' : ''}
<div id="map"></div>
<script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
<script>
  (function () {
    function send(obj) {
      var msg = JSON.stringify(obj);
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent) {
          window.parent.postMessage(msg, '*');
        }
      } catch (e) {}
    }
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-shadow.png'
    });
    var center = [${center.lat}, ${center.lng}];
    var map = L.map('map', { zoomControl: ${interactive ? 'true' : 'false'}, attributionControl: false }).setView(center, ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var marker = ${showMarker ? 'L.marker(center, { draggable: ' + (interactive ? 'true' : 'false') + ' }).addTo(map)' : 'null'};
    ${
      interactive
        ? `map.on('click', function (e) {
        if (!marker) { marker = L.marker(e.latlng, { draggable: true }).addTo(map); }
        else { marker.setLatLng(e.latlng); }
        send({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      if (marker) {
        marker.on('dragend', function () {
          var p = marker.getLatLng();
          send({ lat: p.lat, lng: p.lng });
        });
      }`
        : ''
    }
    setTimeout(function () { map.invalidateSize(); }, 200);
  })();
</script>
</body>
</html>`;
}
