import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Owl Map – React + Leaflet + Tailwind
 */

/* ==== CONFIG ==== */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/* ==== LEAFLET MARKER ASSETS ==== */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

/* ==== STATIC REFERENCE DATA (still used for sidebar + featured markers) ==== */
const BUILDINGS = [
  { id: "DuncanHall", name: "Duncan Hall (CS)", coord: [-95.40134, 29.72069] },
  { id: "Herzstein", name: "Herzstein Hall", coord: [-95.39938, 29.71897] },
  { id: "Brockman", name: "Brockman Hall for Physics", coord: [-95.39986, 29.71993] },
  { id: "Rayzor", name: "Rayzor Hall", coord: [-95.40414, 29.71877] },
  { id: "Fondren", name: "Fondren Library", coord: [-95.40189, 29.71857] },
  { id: "Gibbs", name: "Gibbs Recreation Center", coord: [-95.40604, 29.71488] },
  { id: "BRC", name: "BioScience Research Collaborative (BRC)", coord: [-95.39819, 29.71309] },
  { id: "RiceMC", name: "Rice Memorial Center", coord: [-95.4015, 29.717] },
  { id: "Oshman", name: "Oshman Engineering Design Kitchen", coord: [-95.402, 29.721] },
  { id: "Anderson", name: "Anderson Biological Labs", coord: [-95.399, 29.7195] },
];

const SERVERIES = [
  {
    id: "NorthServery",
    name: "North Servery",
    coord: [-95.40324, 29.72041],
    hours: {
      Weekdays:
        "Breakfast: 7:30 AM – 10:30 AM, Snack: 10:00 AM - 11:00 AM, Lunch: 11:30 AM - 2:00 PM, Dinner: 5:00 PM - 8:00 PM",
      Saturday: "Closed",
      Sunday:
        "Breakfast: 8:00 AM - 11:00 AM, Lunch: 11:30 AM - 2:00 PM, Munch: 3:00 PM - 5:00 PM, Dinner: 5:30 PM - 8:30 PM",
    },
  },
  {
    id: "SeibelServery",
    name: "Seibel Servery",
    coord: [-95.40174, 29.71667],
    hours: {
      Weekdays:
        "Breakfast: 7:30 AM – 10:00 AM, Snack: 10:00 AM - 11:00 AM, Lunch: 11:30 AM - 2:00 PM, Dinner: 5:00 PM - 8:00 PM",
      Saturday: "Closed",
      Sunday:
        "Breakfast: 8:00 AM - 11:00 AM, Lunch: 11:30 AM - 2:00 PM, Munch: 3:00 PM - 5:00 PM, Dinner: 5:30 PM - 8:30 PM",
    },
  },
  {
    id: "WestServery",
    name: "West Servery",
    coord: [-95.405, 29.719],
    hours: {
      Weekdays:
        "Breakfast: 7:30 AM – 10:00 AM, Lunch: 11:30 AM - 1:30 PM, Munch: 2:00 PM - 4:00 PM, Snack: 4:00 PM - 5:00 PM, Dinner: 5:00 PM - 9:00 PM",
      Saturday:
        "Breakfast: 8:00 AM - 11:00 AM, Lunch: 11:30 AM - 2:00 PM, Munch: 3:00 PM - 5:00 PM, Dinner: 5:30 PM - 8:30 PM",
      Sunday: "Closed",
    },
  },
  {
    id: "SouthServery",
    name: "South Servery",
    coord: [-95.405, 29.719],
    hours: {
      Weekdays:
        "Breakfast: 7:30 AM – 10:00 AM, Lunch: 11:30 AM - 1:30 PM, Munch: 2:00 PM - 4:00 PM, Snack: 4:00 PM - 5:00 PM, Dinner: 5:00 PM - 9:00 PM",
      Saturday: "Closed",
      Sunday: "Closed",
    },
  },
  {
    id: "BakerServery",
    name: "Baker Servery",
    coord: [-95.405, 29.719],
    hours: {
      Weekdays:
        "Breakfast: 7:30 AM – 10:30 AM, Lunch: 11:30 AM - 2:00 PM, Dinner: 5:00 PM - 8:00 PM, Late Night Dining: 9:00 PM - 11:00 PM",
      Saturday:
        "Breakfast: 8:00 AM - 11:00 AM, Lunch: 11:30 AM - 2:00 PM, Munch: 3:00 PM - 5:00 PM, Dinner: 5:30 PM - 8:30 PM",
      Sunday: "Closed",
    },
  },
];

/* ==== UTILS ==== */
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
function normalizeName(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}
function toMealsList(v) {
  if (Array.isArray(v)) v = v.join(", ");
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (v && typeof v === "object") {
    return Object.entries(v).map(([k, times]) => `${k}: ${times}`);
  }
  return [];
}
function parseTimeToMinutes(t) {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap) {
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
  }
  return hh * 60 + mm;
}
function createCustomMarker(color, emoji, size = 30) {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: ${size * 0.5}px;
      cursor: pointer;
      transition: transform 0.2s;
    ">${emoji}</div>`,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/* ==== COMPONENT ==== */
export default function RiceNavigatorApp() {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const markersRef = useRef([]);
  const pathLineRef = useRef(null);

  // Nodes from API: [{ name, coord:[lon,lat] }]
  const [nodes, setNodes] = useState([]);
  const [nodesError, setNodesError] = useState("");
  const nameToCoordRef = useRef(new Map());

  // From/To use node names
  const [origin, setOrigin] = useState("");
  const [selected, setSelected] = useState("");

  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    name: "COMP 182",
    buildingId: BUILDINGS[0].id,
    day: "Mon",
    start: "10:00",
    end: "10:50",
  });
  const [serveryInfo, setServeryInfo] = useState(null);

  const [routeMeters, setRouteMeters] = useState(null);
  const [routeMinutes, setRouteMinutes] = useState(null);

  const campusCenter = useMemo(() => ({ lon: -95.4019, lat: 29.7186 }), []);

  /* ====== NAME → COORD MAP (from nodes) ====== */
  function rebuildNameToCoordMap(fetchedNodes) {
    const m = new Map();
    const add = (name, coord) => {
      const raw = String(name).trim();
      m.set(raw.toLowerCase(), coord);
      m.set(normalizeName(raw), coord);
    };
    fetchedNodes.forEach((n) => add(n.name, n.coord));
    nameToCoordRef.current = m;
  }
  function coordFromName(name) {
    if (!name) return null;
    const raw = String(name).trim();
    const m = nameToCoordRef.current;
    return m.get(raw.toLowerCase()) || m.get(normalizeName(raw)) || null;
  }
  function namesToLatLngs(names) {
    const coordsLonLat = [];
    const missing = [];
    for (const n of names) {
      const c = coordFromName(n);
      if (c) coordsLonLat.push(c);
      else missing.push(n);
    }
    const latLngs = coordsLonLat.map(([lon, lat]) => [lat, lon]);
    return { latLngs, coordsLonLat, missing };
  }

  /* ====== FETCH NODES ON MOUNT ====== */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setNodesError("");
        const res = await fetch(`${API_BASE}/nodes`);
        if (!res.ok) throw new Error(`nodes API HTTP ${res.status}`);
        const raw = await res.json();

        // Accept multiple shapes and coerce into array
        let list;
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.nodes)) {
          list = raw.nodes;
        } else if (raw && Array.isArray(raw.data)) {
          list = raw.data;
        } else if (raw && Array.isArray(raw.result)) {
          list = raw.result;
        } else if (raw && typeof raw === "object") {
          // Object map: { "Name": [lat, lon] } or { "Name": {lat, lon} }
          list = Object.entries(raw).map(([name, v]) => {
            if (Array.isArray(v)) {
              const [lat, lon] = v;
              return [name, lat, lon];
            } else if (v && typeof v === "object") {
              const lat = v.lat ?? v.latitude;
              const lon = v.lon ?? v.lng ?? v.longitude;
              return [name, lat, lon];
            }
            return [name, undefined, undefined];
          });
        } else {
          throw new Error("nodes payload not array-like");
        }

        // Normalize to [{name, coord:[lon,lat]}]
        const parsed = (list || [])
          .map((item) => {
            if (Array.isArray(item)) {
              // Expect [name, lat, lon]
              const [name, lat, lon] = item;
              return { name: String(name), coord: [Number(lon), Number(lat)] };
            } else if (item && typeof item === "object") {
              const name = item.name ?? item[0];
              const lat = item.lat ?? item[1];
              const lon = item.lon ?? item[2];
              return { name: String(name), coord: [Number(lon), Number(lat)] };
            }
            return null;
          })
          .filter(
            (n) =>
              n &&
              n.name &&
              Number.isFinite(n.coord[0]) &&
              Number.isFinite(n.coord[1])
          );

        if (cancelled) return;

        if (!parsed.length) {
          throw new Error("nodes API returned empty/unparseable payload");
        }

        setNodes(parsed);
        rebuildNameToCoordMap(parsed);

        if (!origin && parsed[0]?.name) setOrigin(parsed[0].name);
        if (!selected && parsed[1]?.name) setSelected(parsed[1].name);

        // Optional: add small 📍 markers for each node
        const map = mapRef.current;
        if (map) {
          parsed.forEach((n) => {
            L.marker([n.coord[1], n.coord[0]], {
              icon: createCustomMarker("#6366f1", "📍", 20),
            })
              .addTo(map)
              .bindPopup(`<strong>${n.name}</strong>`);
          });
        }
      } catch (e) {
        console.error("Failed to load nodes:", e);
        if (!cancelled) setNodesError(e.message || String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [origin, selected]);

  /* ====== INIT MAP ====== */
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = L.map(mapContainer.current, {
      center: [campusCenter.lat, campusCenter.lon],
      zoom: 15,
      zoomControl: true,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    // Featured building markers
    BUILDINGS.forEach((building) => {
      const marker = L.marker([building.coord[1], building.coord[0]], {
        icon: createCustomMarker("#3B82F6", "🏛️", 28),
      })
        .bindPopup(
          `<div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: bold;">
              ${building.name}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">
              Academic Building
            </p>
            <p style="margin: 4px 0; color: #059669; font-weight: bold;">
              Status: Open
            </p>
          </div>`
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Servery markers
    SERVERIES.forEach((servery) => {
      const marker = L.marker([servery.coord[1], servery.coord[0]], {
        icon: createCustomMarker("#10B981", "🍽️", 28),
      })
        .bindPopup(
          `<div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #059669; font-size: 16px; font-weight: bold;">
              ${servery.name}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">
              Dining Hall
            </p>
            <p style="margin: 4px 0; color: #059669; font-weight: bold;">
              Status: Open
            </p>
            <div style="margin-top: 8px; font-size: 12px;">
              <strong>Today's Hours:</strong><br>
              B: 7-10a, L: 11-2p, D: 5-8p
            </div>
          </div>`
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [campusCenter]);

  /* ====== FETCH ROUTE & DRAW POLYLINE ====== */
  async function fetchRouteNames(startName, endName, signal) {
    const res = await fetch(
      `${API_BASE}/navigate?start_str=${encodeURIComponent(
        startName
      )}&end_str=${encodeURIComponent(endName)}`,
      { signal }
    );
    if (!res.ok) throw new Error(`Route API error: ${res.status}`);
    const data = await res.json();

    const names = Array.isArray(data) ? data : data.path;
    if (!Array.isArray(names) || names.length < 2) {
      throw new Error("Route API returned no path names");
    }
    const distanceMeters =
      typeof data.distance === "number" ? data.distance : null;

    return { names, distanceMeters };
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin || !selected) return;

    if (pathLineRef.current) {
      map.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const { names, distanceMeters } = await fetchRouteNames(
          origin,
          selected,
          ac.signal
        );

        const { latLngs, coordsLonLat, missing } = namesToLatLngs(names);
        if (missing.length) {
          console.warn("Missing coords for node names from API:", missing);
        }
        if (latLngs.length < 2)
          throw new Error("No mappable coords from names");

        pathLineRef.current = L.polyline(latLngs, {
          color: "#2563eb",
          weight: 5,
          opacity: 0.9,
        }).addTo(map);

        map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });

        const meters =
          Number.isFinite(distanceMeters) && distanceMeters >= 0
            ? distanceMeters
            : (() => {
                let total = 0;
                for (let i = 0; i < coordsLonLat.length - 1; i++) {
                  total += haversineMeters(
                    coordsLonLat[i],
                    coordsLonLat[i + 1]
                  );
                }
                return total;
              })();

        setRouteMeters(meters);
        setRouteMinutes(minutesAtSpeed(meters));
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn("Route API failed; attempting straight-line fallback:", err);
        setRouteMeters(null);
        setRouteMinutes(null);

        const a = coordFromName(origin);
        const b = coordFromName(selected);
        if (a && b) {
          const latlngs = [
            [a[1], a[0]],
            [b[1], b[0]],
          ];
          pathLineRef.current = L.polyline(latlngs, {
            color: "#2563eb",
            weight: 4,
            opacity: 0.7,
            dashArray: "10, 5",
          }).addTo(map);
          map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
          const straight = haversineMeters(a, b);
          setRouteMeters(straight);
          setRouteMinutes(minutesAtSpeed(straight));
        }
      }
    })();

    return () => ac.abort();
  }, [origin, selected, nodes]);

  /* ====== COURSES (kept from your version) ====== */
  function addCourse(e) {
    e?.preventDefault?.();
    const id = `${newCourse.name}-${Date.now()}`;
    setCourses((prev) => [...prev, { id, ...newCourse }]);
  }
  function removeCourse(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  const dayETA = useMemo(() => {
    const byDay = courses.reduce((acc, c) => {
      (acc[c.day] ||= []).push(c);
      return acc;
    }, {});
    const result = {};
    Object.entries(byDay).forEach(([day, list]) => {
      const sorted = [...list].sort(
        (a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start)
      );
      let totalMeters = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = BUILDINGS.find((b) => b.id === sorted[i].buildingId)?.coord;
        const b = BUILDINGS.find((b) => b.id === sorted[i + 1].buildingId)
          ?.coord;
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

  /* ====== RENDER ====== */
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Sidebar */}
      <aside className="w-1/3 p-4 space-y-4 bg-white border-r shadow-lg overflow-y-auto">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <span className="text-3xl">🦉</span>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">Owl Map</h1>
            <p className="text-sm text-gray-600">Rice University Navigator</p>
          </div>
        </div>

        {/* Quick ETA */}
        <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            📍 Quick Walk ETA
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From:
              </label>
              <select
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                disabled={!nodes.length}
              >
                {!nodes.length && (
                  <option>
                    {nodesError ? `Error: ${nodesError}` : "Loading nodes…"}
                  </option>
                )}
                {nodes.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To:
              </label>
              <select
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={!nodes.length}
              >
                {!nodes.length && (
                  <option>
                    {nodesError ? `Error: ${nodesError}` : "Loading nodes…"}
                  </option>
                )}
                {nodes.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="block text-xs font-medium text-gray-700 mb-1">
              <p className="text-sm">
                <span className="font-medium">Distance:</span>{" "}
                {routeMeters != null ? `${routeMeters.toFixed(0)} m` : "—"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Walk time:</span>{" "}
                {routeMinutes != null ? `${routeMinutes.toFixed(1)} min` : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h2 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            📚 Your Courses
          </h2>
          <form className="space-y-3" onSubmit={addCourse}>
            <input
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Course name (e.g., COMP 182)"
              value={newCourse.name}
              onChange={(e) =>
                setNewCourse((c) => ({ ...c, name: e.target.value }))
              }
              required
            />
            <select
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={newCourse.buildingId}
              onChange={(e) =>
                setNewCourse((c) => ({ ...c, buildingId: e.target.value }))
              }
            >
              {BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="border rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={newCourse.day}
                onChange={(e) =>
                  setNewCourse((c) => ({ ...c, day: e.target.value }))
                }
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                className="border rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Start"
                value={newCourse.start}
                onChange={(e) =>
                  setNewCourse((c) => ({ ...c, start: e.target.value }))
                }
              />
              <input
                className="border rounded-lg px-2 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="End"
                value={newCourse.end}
                onChange={(e) =>
                  setNewCourse((c) => ({ ...c, end: e.target.value }))
                }
              />
            </div>
            <button className="w-full rounded-lg py-2 bg-green-600 text-white font-medium shadow hover:shadow-md hover:bg-green-700 transition-all">
              Add Course
            </button>
          </form>

          <div className="mt-4">
            <ul className="divide-y bg-white border rounded-lg max-h-48 overflow-y-auto">
              {courses.length === 0 && (
                <li className="p-3 text-sm text-gray-500 text-center">
                  No courses yet. Add one above.
                </li>
              )}
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="p-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-600">
                      {c.day} {c.start}–{c.end} •{" "}
                      {BUILDINGS.find((b) => b.id === c.buildingId)?.name}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCourse(c.id)}
                    className="text-red-600 text-sm hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Daily walking time summary */}
        <section className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h2 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
            🚶‍♂️ Daily Walk Time
          </h2>
          <div className="bg-white border rounded-lg divide-y max-h-32 overflow-y-auto">
            {Object.keys(dayETA).length === 0 && (
              <div className="p-3 text-sm text-gray-500 text-center">
                Add 2+ classes on a day to see totals.
              </div>
            )}
            {Object.entries(dayETA).map(([day, info]) => (
              <div
                key={day}
                className="p-3 text-sm flex items-center justify-between hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{day}</span>
                <span className="text-purple-600 font-medium">
                  {info.totalMinutes.toFixed(1)} min
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Serveries */}
        <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h2 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            🍽️ Serveries & Hours
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {SERVERIES.map((s) => (
              <button
                key={s.id}
                onClick={() => openServery(s.id)}
                className="px-3 py-1 rounded-full border border-orange-300 hover:bg-orange-100 hover:border-orange-400 transition-colors text-sm"
              >
                {s.name}
              </button>
            ))}
          </div>
          {serveryInfo && (
            <div className="bg-white p-3 border rounded-lg">
              <div className="font-medium text-orange-800 mb-2">
                {serveryInfo.name}
              </div>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-sm space-y-1">
                  {Object.entries(serveryInfo.hours).map(([day, value]) => {
                    const meals = toMealsList(value);
                    return (
                      <li key={day} className="mb-1">
                        <span className="text-gray-700 font-bold">{day}:</span>
                        <ul className="ml-4 list-disc text-black">
                          {meals.map((meal, i) => (
                            <li key={i}>{meal}</li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </section>
      </aside>

      {/* Map */}
      <div
        style={{
          flex: 1,
          height: "100vh",
          position: "relative",
        }}
      >
        <div
          ref={mapContainer}
          style={{
            height: "100%",
            width: "100%",
            minHeight: "100vh",
          }}
        />
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg border z-[1100]">
          <h4 className="font-semibold text-gray-800 mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-black">🏛️ Academic Buildings</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-black">🍽️ Serveries</span>
            </div>
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded px-2 py-1 text-xs shadow">
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}
