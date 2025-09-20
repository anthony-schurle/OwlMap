import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Fix default marker icons under Vite/webpack ---
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = new Icon({
  iconUrl: marker1x,
  iconRetinaUrl: marker2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- Helpers ---
function haversineMeters([lon1, lat1], [lon2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function minutesAtSpeed(meters, metersPerSecond = 1.4) {
  return meters / metersPerSecond / 60;
}

// --- Data ---
const BUILDINGS = [
  { id: "DuncanHall", name: "Duncan Hall (CS)", coord: [-95.40134, 29.72069] },
  { id: "Herzstein", name: "Herzstein Hall", coord: [-95.39938, 29.71897] },
  { id: "Brockman", name: "Brockman Hall for Physics", coord: [-95.39986, 29.71993] },
  { id: "Rayzor", name: "Rayzor Hall", coord: [-95.40414, 29.71877] },
  { id: "Fondren", name: "Fondren Library", coord: [-95.40189, 29.71857] },
  { id: "Gibbs", name: "Gibbs Recreation Center", coord: [-95.40604, 29.71488] },
  { id: "BRC", name: "BioScience Research Collaborative (BRC)", coord: [-95.39819, 29.71309] },
];
const SERVERIES = [
  {
    id: "NorthServery",
    name: "North Servery",
    coord: [-95.40324, 29.72041],
    hours: {
      Mon: "B: 7–10a, L: 11–2p, D: 5–8p",
      Fri: "B: 7–10a, L: 11–2p, D: 5–7p",
    },
  },
  {
    id: "SeibelServery",
    name: "Seibel Servery",
    coord: [-95.40174, 29.71667],
    hours: {
      Mon: "B: 7–10a, L: 11–2p, D: 5–8p",
      Fri: "B: 7–10a, L: 11–2p, D: 5–7p",
    },
  },
];

// Optional recenter helper
function FlyTo({ center }) {
  const map = useMap();
  useMemo(() => {
    if (center) map.setView([center.lat, center.lon], 15.2, { animate: true });
  }, [center, map]);
  return null;
}

export default function RiceNavigatorAppLeaflet() {
  const [origin, setOrigin] = useState(BUILDINGS[0].id);
  const [selected, setSelected] = useState(BUILDINGS[1].id);
  const [serveryInfo, setServeryInfo] = useState(null);

  const campusCenter = useMemo(() => ({ lon: -95.4019, lat: 29.7186 }), []);
  const originCoord = BUILDINGS.find((b) => b.id === origin)?.coord;
  const selectedCoord = BUILDINGS.find((b) => b.id === selected)?.coord;

  const straightMeters =
    originCoord && selectedCoord ? haversineMeters(originCoord, selectedCoord) : 0;
  const straightMinutes = straightMeters ? minutesAtSpeed(straightMeters) : 0;

  const linePositions =
    originCoord && selectedCoord
      ? [
          [originCoord[1], originCoord[0]],
          [selectedCoord[1], selectedCoord[0]],
        ]
      : null;

  function openServery(id) {
    const s = SERVERIES.find((x) => x.id === id);
    if (s) setServeryInfo({ name: s.name, hours: s.hours });
  }

  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-[360px,1fr]">
      {/* Sidebar */}
      <aside className="p-4 space-y-4 bg-white border-r">
        <h1 className="text-2xl font-semibold">Rice Navigator (Leaflet)</h1>
        <p className="text-sm text-gray-600">React + Leaflet + OSM</p>

        {/* Quick ETA */}
        <section>
          <h2 className="font-semibold">Quick walk ETA</h2>
          <div className="mt-2">
            <select
              className="border rounded px-2 py-1 w-full"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            >
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2">
            <select
              className="border rounded px-2 py-1 w-full"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm mt-2">
            Distance: {straightMeters ? `${straightMeters.toFixed(0)} m` : "—"}
            <br />
            Est. walk time: {straightMinutes ? `${straightMinutes.toFixed(1)} min` : "—"}
          </p>
        </section>

        {/* Serveries */}
        <section>
          <h2 className="font-semibold">Serveries</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {SERVERIES.map((s) => (
              <button
                key={s.id}
                onClick={() => openServery(s.id)}
                className="px-3 py-1 rounded-full border hover:bg-gray-50"
              >
                {s.name}
              </button>
            ))}
          </div>
          {serveryInfo && (
            <div className="mt-3 p-3 border rounded bg-green-50">
              <div className="font-medium">{serveryInfo.name}</div>
              <ul className="text-sm mt-1 space-y-0.5">
                {Object.entries(serveryInfo.hours).map(([d, h]) => (
                  <li key={d} className="flex justify-between">
                    <span className="text-gray-700">{d}</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </aside>

      {/* Map (fills right column fully) */}
      <div className="relative w-full h-full">
        <MapContainer
          center={[campusCenter.lat, campusCenter.lon]}
          zoom={15.2}
          className="absolute inset-0"
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {BUILDINGS.map((b) => (
            <Marker key={b.id} position={[b.coord[1], b.coord[0]]}>
              <Popup><strong>{b.name}</strong></Popup>
            </Marker>
          ))}

          {SERVERIES.map((s) => (
            <Marker key={s.id} position={[s.coord[1], s.coord[0]]}>
              <Popup><strong>{s.name}</strong></Popup>
            </Marker>
          ))}

          {linePositions && (
            <Polyline positions={linePositions} pathOptions={{ weight: 4, opacity: 0.7 }} />
          )}

          <FlyTo center={campusCenter} />
        </MapContainer>

        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-1 text-xs shadow">
          Map data © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}
