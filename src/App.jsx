import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

/**
 * Owl Map – Barebones Frontend
 * Tech: React + Mapbox GL JS + Tailwind utility classes
 */

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;


// --- Simple haversine distance (meters) and walking time (minutes) ---
function haversineMeters([lon1, lat1], [lon2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function minutesAtSpeed(meters, metersPerSecond = 1.4) { // ~5 km/h walk
  return (meters / metersPerSecond) / 60;
}

// --- Minimal campus POIs (buildings + serveries) ---
// Coordinates are approximate; replace with your own authoritative dataset later.
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
      Tue: "B: 7–10a, L: 11–2p, D: 5–8p",
      Wed: "B: 7–10a, L: 11–2p, D: 5–8p",
      Thu: "B: 7–10a, L: 11–2p, D: 5–8p",
      Fri: "B: 7–10a, L: 11–2p, D: 5–7p",
      Sat: "Br: 10–2p, D: 5–7p",
      Sun: "Br: 10–2p, D: 5–8p",
    },
  },
  {
    id: "SeibelServery",
    name: "Seibel Servery",
    coord: [-95.40174, 29.71667],
    hours: {
      Mon: "B: 7–10a, L: 11–2p, D: 5–8p",
      Tue: "B: 7–10a, L: 11–2p, D: 5–8p",
      Wed: "B: 7–10a, L: 11–2p, D: 5–8p",
      Thu: "B: 7–10a, L: 11–2p, D: 5–8p",
      Fri: "B: 7–10a, L: 11–2p, D: 5–7p",
      Sat: "Br: 10–2p, D: 5–7p",
      Sun: "Br: 10–2p, D: 5–8p",
    },
  },
];

// --- Utility: parse HH:MM to minutes since midnight ---
function parseTimeToMinutes(t) {
  // accepts "HH:MM" (24h) or "H:MMAM/PM" -> converts to minutes since midnight
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!m) return null;
  let hh = parseInt(m[1]);
  const mm = parseInt(m[2]);
  const ap = m[3]?.toUpperCase();
  if (ap) {
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
  }
  return hh * 60 + mm;
}

// --- Component ---
export default function RiceNavigatorApp() {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);

  const [origin, setOrigin] = useState(BUILDINGS[0].id);
  const [selected, setSelected] = useState(BUILDINGS[1].id);
  const [courses, setCourses] = useState([]); // {id,name,buildingId,day,start,end}
  const [newCourse, setNewCourse] = useState({ name: "COMP 182", buildingId: BUILDINGS[0].id, day: "Mon", start: "10:00", end: "10:50" });
  const [serveryInfo, setServeryInfo] = useState(null); // {name,hours}

  const campusCenter = useMemo(() => ({ lon: -95.4019, lat: 29.7186 }), []);

  // Initialize the Mapbox map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [campusCenter.lon, campusCenter.lat],
      zoom: 15.2,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Add building markers
    map.on("load", () => {
      BUILDINGS.forEach((b) => {
        const el = document.createElement("div");
        el.className = "rounded-full w-3 h-3 bg-blue-600 border-2 border-white shadow";
        const m = new mapboxgl.Marker({ element: el })
          .setLngLat(b.coord)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>${b.name}</strong>`))
          .addTo(map);
      });

      // Add servery markers
      SERVERIES.forEach((s) => {
        const el = document.createElement("div");
        el.className = "rounded-full w-3 h-3 bg-green-600 border-2 border-white shadow";
        const m = new mapboxgl.Marker({ element: el })
          .setLngLat(s.coord)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>${s.name}</strong>`))
          .addTo(map);
      });
    });

    return () => map.remove();
  }, [campusCenter]);

  // Draw a simple line between origin and selected (for quick ETA)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const from = BUILDINGS.find((b) => b.id === origin)?.coord;
    const to = BUILDINGS.find((b) => b.id === selected)?.coord;
    if (!from || !to) return;

    const line = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [from, to] },
          properties: {},
        },
      ],
    };

    if (map.getSource("od-line")) {
      map.getSource("od-line").setData(line);
    } else {
      map.addSource("od-line", { type: "geojson", data: line });
      map.addLayer({
        id: "od-line",
        type: "line",
        source: "od-line",
        paint: { "line-width": 4, "line-color": "#2563eb", "line-opacity": 0.7 },
      });
    }
  }, [origin, selected]);

  const originCoord = BUILDINGS.find((b) => b.id === origin)?.coord;
  const selectedCoord = BUILDINGS.find((b) => b.id === selected)?.coord;
  const straightMeters = originCoord && selectedCoord ? haversineMeters(originCoord, selectedCoord) : 0;
  const straightMinutes = straightMeters ? minutesAtSpeed(straightMeters) : 0;

  // Add a course
  function addCourse(e) {
    e?.preventDefault?.();
    const id = `${newCourse.name}-${Date.now()}`;
    setCourses((prev) => [...prev, { id, ...newCourse }]);
  }

  // Remove a course
  function removeCourse(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  // Compute naive schedule path time per day (sort by start; straight-line hops)
  const dayETA = useMemo(() => {
    const byDay = courses.reduce((acc, c) => {
      (acc[c.day] ||= []).push(c);
      return acc;
    }, {});

    const result = {};
    Object.entries(byDay).forEach(([day, list]) => {
      const sorted = [...list].sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
      let totalMeters = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = BUILDINGS.find((b) => b.id === sorted[i].buildingId)?.coord;
        const b = BUILDINGS.find((b) => b.id === sorted[i + 1].buildingId)?.coord;
        if (a && b) totalMeters += haversineMeters(a, b);
      }
      result[day] = {
        classes: sorted,
        totalMinutes: minutesAtSpeed(totalMeters),
        totalMeters,
      };
    });
    return result;
  }, [courses]);

  function openServery(id) {
    const s = SERVERIES.find((x) => x.id === id);
    if (s) setServeryInfo({ name: s.name, hours: s.hours });
  }

  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-[360px,1fr]">
      {/* Sidebar */}
      <aside className="p-4 space-y-4 bg-white border-r">
        <h1 className="text-2xl font-semibold">Rice Navigator</h1>
        <p className="text-sm text-gray-600">Barebones prototype — React + Mapbox GL JS</p>

        {/* Quick ETA tool */}
        <section className="space-y-2">
          <h2 className="font-semibold">Quick walk ETA</h2>
          <div className="flex gap-2">
            <select className="border rounded px-2 py-1 w-full" value={origin} onChange={(e) => setOrigin(e.target.value)}>
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <select className="border rounded px-2 py-1 w-full" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <p className="text-sm mt-2">
            Straight-line distance: {straightMeters ? `${straightMeters.toFixed(0)} m` : "—"}
            <br />
            Est. walk time: {straightMinutes ? `${straightMinutes.toFixed(1)} min` : "—"}
          </p>
        </section>

        {/* Courses */}
        <section className="space-y-2">
          <h2 className="font-semibold">Your courses</h2>
          <form className="space-y-2" onSubmit={addCourse}>
            <input
              className="border rounded px-2 py-1 w-full"
              placeholder="Course name (e.g., COMP 182)"
              value={newCourse.name}
              onChange={(e) => setNewCourse((c) => ({ ...c, name: e.target.value }))}
              required
            />
            <div className="flex gap-2">
              <select className="border rounded px-2 py-1 w-full" value={newCourse.buildingId} onChange={(e) => setNewCourse((c) => ({ ...c, buildingId: e.target.value }))}>
                {BUILDINGS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select className="border rounded px-2 py-1" value={newCourse.day} onChange={(e) => setNewCourse((c) => ({ ...c, day: e.target.value }))}>
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input className="border rounded px-2 py-1" placeholder="Start" value={newCourse.start} onChange={(e) => setNewCourse((c) => ({ ...c, start: e.target.value }))} />
              <input className="border rounded px-2 py-1" placeholder="End" value={newCourse.end} onChange={(e) => setNewCourse((c) => ({ ...c, end: e.target.value }))} />
            </div>
            <button className="w-full rounded-xl py-2 bg-blue-600 text-white shadow hover:shadow-md">Add course</button>
          </form>

          <ul className="divide-y border rounded">
            {courses.length === 0 && <li className="p-3 text-sm text-gray-500">No courses yet. Add one above.</li>}
            {courses.map((c) => (
              <li key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-600">{c.day} {c.start}–{c.end} • {BUILDINGS.find((b) => b.id === c.buildingId)?.name}</div>
                </div>
                <button onClick={() => removeCourse(c.id)} className="text-red-600 text-sm">Remove</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Daily walking time summary */}
        <section className="space-y-2">
          <h2 className="font-semibold">Daily walk time (straight-line)</h2>
          <div className="border rounded divide-y">
            {Object.keys(dayETA).length === 0 && (
              <div className="p-3 text-sm text-gray-500">Add 2+ classes on a day to see totals.</div>
            )}
            {Object.entries(dayETA).map(([day, info]) => (
              <div key={day} className="p-3 text-sm flex items-center justify-between">
                <span className="font-medium">{day}</span>
                <span>{info.totalMinutes.toFixed(1)} min</span>
              </div>
            ))}
          </div>
        </section>

        {/* Serveries */}
        <section className="space-y-2">
          <h2 className="font-semibold">Serveries & hours</h2>
          <div className="flex flex-wrap gap-2">
            {SERVERIES.map((s) => (
              <button key={s.id} onClick={() => openServery(s.id)} className="px-3 py-1 rounded-full border hover:bg-gray-50">
                {s.name}
              </button>
            ))}
          </div>
          {serveryInfo && (
            <div className="mt-2 p-3 border rounded bg-green-50">
              <div className="font-medium">{serveryInfo.name}</div>
              <ul className="text-sm mt-1 space-y-0.5">
                {Object.entries(serveryInfo.hours).map(([d, h]) => (
                  <li key={d} className="flex justify-between"><span className="text-gray-700">{d}</span><span>{h}</span></li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Dev notes */}
        <details className="mt-2 text-xs text-gray-600">
          <summary className="cursor-pointer">Dev notes</summary>
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>Replace placeholder coordinates and hours with authoritative data sources.</li>
            <li>For real routes, integrate Mapbox Directions or build a campus graph (sidewalks) and run Dijkstra/A*. This demo uses straight-line distance for simplicity.</li>
            <li>Walking speed is set to 1.4 m/s (~5 km/h). Tune per settings.</li>
            <li>To use with Next.js/CRA/Vite, just import & render <code>&lt;RiceNavigatorApp /&gt;</code>.</li>
          </ul>
        </details>
      </aside>

      {/* Map */}
      <div className="relative">
        <div ref={mapContainer} className="absolute inset-0" />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-1 text-xs shadow">
          Map data © OpenStreetMap contributors, © Mapbox
        </div>
      </div>
    </div>
  );
}
