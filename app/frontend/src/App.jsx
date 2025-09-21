import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Owl Map – React + Leaflet + Tailwind */

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
  return (R * c);
}
function minutesAtSpeed(feet, fps = 4.2) {
  return feet / fps / 60;
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
function pathLengthMetersLonLat(pathLonLat) {
  let total = 0;
  for (let i = 0; i < pathLonLat.length - 1; i++) {
    total += haversineMeters(pathLonLat[i], pathLonLat[i + 1]);
  }
  return total;
}

// Events helper functions
function formatEventTime(startTime, endTime) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function isToday(dateString) {
  const today = new Date();
  const eventDate = new Date(dateString);
  return today.toDateString() === eventDate.toDateString();
}

function getEventTypeStyle(type) {
  switch (type) {
    case "academic":
      return { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" };
    case "career":
      return { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" };
    case "sports":
      return { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
  }
}

/* ==== COLLAPSIBLE SECTION COMPONENT ==== */
async function fetchCourseLocation(courseCode) {
  try {
    const res = await fetch(`/course-location?code=${encodeURIComponent(courseCode)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data['location-name'];
  } catch (err) {
    console.error("Failed to fetch course location:", err);
    return null;
  }
}

function CollapsibleSection({ title, emoji, bgColor, borderColor, textColor, isExpanded, onToggle, children }) {
  return (
    <section className={`${bgColor} rounded-lg border ${borderColor}`}>
      <button
        onClick={onToggle}
        className={`w-full p-4 text-left font-semibold ${textColor} flex items-center justify-between hover:opacity-80 transition-opacity ${bgColor}`}
      >
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span>{title}</span>
        </div>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-[800px] pb-4' : 'max-h-0'
      }`}>
        <div className="px-4">
          {children}
        </div>
      </div>
    </section>
  );
}

/* ==== COMPONENT ==== */
export default function RiceNavigatorApp() {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const markersRef = useRef([]);
  const pathLineRef = useRef(null);
  const dragRef = useRef(null);
  const sidebarRef = useRef(null);

  // Sidebar drag state
  const [sidebarWidth, setSidebarWidth] = useState(400); // Default width in pixels
  const [isDragging, setIsDragging] = useState(false);

  // Collapsible state
  const [sectionStates, setSectionStates] = useState({
    walkEta: true,
    courses: true,
    events: true,
    serveries: false,
  });

  // Nodes from API: [{ name, coord:[lon,lat] }]
  const [nodes, setNodes] = useState([]);
  const [nodesError, setNodesError] = useState("");
  const nameToCoordRef = useRef(new Map());

  // From/To are **node names**
  const [origin, setOrigin] = useState("");
  const [selected, setSelected] = useState("");

  // Courses UI state (unchanged)
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    name: "COMP 182",
    day: "Mon",
    start: "10:00",
    end: "10:50",
  });
  const [serveryInfo, setServeryInfo] = useState(null);

  // Events state
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "COMP 182 Review Session",
      location: "Duncan Hall (CS)",
      buildingId: "DuncanHall",
      date: "2025-09-22",
      startTime: "14:00",
      endTime: "15:30",
      type: "academic",
      description: "Review session for upcoming exam"
    },
    {
      id: 2,
      name: "Career Fair",
      location: "Rice Memorial Center", 
      buildingId: "RiceMC",
      date: "2025-09-23",
      startTime: "10:00",
      endTime: "16:00",
      type: "career",
      description: "Annual career fair with 50+ companies"
    },
    {
      id: 3,
      name: "Rice Volleyball vs Houston",
      location: "Tudor Fieldhouse",
      buildingId: "Gibbs",
      date: "2025-09-24", 
      startTime: "19:00",
      endTime: "21:00",
      type: "sports",
      description: "Home volleyball match"
    }
  ]);

  const [selectedEventDate, setSelectedEventDate] = useState("today");

  // Distance/time for the current route
  const [routeMeters, setRouteMeters] = useState(null);
  const [routeMinutes, setRouteMinutes] = useState(null);

  const campusCenter = useMemo(() => ({ lon: -95.4019, lat: 29.7186 }), []);

  // Toggle section function
  const toggleSection = (sectionKey) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Drag functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newWidth = e.clientX;
    // Set minimum width of 200px and maximum of 600px
    const clampedWidth = Math.max(0, Math.min(600, newWidth));
    setSidebarWidth(clampedWidth);
    
    // Trigger map resize when dragging
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 100);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for drag functionality
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Trigger map resize when sidebar width changes
  useEffect(() => {
    if (mapRef.current) {
      const timeoutId = setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [sidebarWidth]);

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

  // Filtered events computed value
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      
      switch (selectedEventDate) {
        case "today":
          return eventDate.toDateString() === today;
        case "upcoming":
          return eventDate >= now;
        case "all":
          return true;
        default:
          return true;
      }
    }).sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [events, selectedEventDate]);

  /* ====== FETCH NODES ON MOUNT ====== */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setNodesError("");
        const res = await fetch(`/nodes`);
        if (!res.ok) throw new Error(`nodes API HTTP ${res.status}`);
        const raw = await res.json();

        // Normalize the payload to [{name, coord:[lon,lat]}]
        let list;
        if (Array.isArray(raw)) list = raw;
        else if (raw && Array.isArray(raw.nodes)) list = raw.nodes;
        else if (raw && Array.isArray(raw.data)) list = raw.data;
        else if (raw && Array.isArray(raw.result)) list = raw.result;
        else if (raw && typeof raw === "object") {
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
        } else throw new Error("nodes payload not array-like");

        const parsed = (list || [])
          .map((item) => {
            if (Array.isArray(item)) {
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
        if (!parsed.length) throw new Error("nodes API returned empty payload");

        setNodes(parsed);
        rebuildNameToCoordMap(parsed);

        // Default select the first two nodes
        if (!origin && parsed[0]?.name) setOrigin(parsed[0].name);
        if (!selected && parsed[1]?.name) setSelected(parsed[1].name);

        // Optional: add small node markers
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
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [campusCenter]);

  /* ====== ROUTE FETCH (BY NAMES) & DRAW POLYLINE ====== */
  async function fetchRouteNames(startName, endName, signal) {
    const url = `/navigate?start_str=${encodeURIComponent(
      startName
    )}&end_str=${encodeURIComponent(endName)}`;
    const res = await fetch(url, { signal });
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

    // clear previous line
    if (pathLineRef.current) {
      map.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }

    const ac = new AbortController();

    (async () => {
      try {
        // 1) ask API for path of node names
        const { names, distanceMeters } = await fetchRouteNames(
          origin,
          selected,
          ac.signal
        );

        // 2) convert names → coordinates
        const { latLngs, coordsLonLat, missing } = namesToLatLngs(names);
        if (missing.length) {
          console.warn("Missing coords for nodes:", missing);
        }
        if (latLngs.length < 2) {
          throw new Error("No mappable coordinates from route names");
        }

        // 3) draw route
        pathLineRef.current = L.polyline(latLngs, {
          color: "#2563eb",
          weight: 5,
          opacity: 0.9,
        }).addTo(map);

        // fit bounds
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40] });

        // 4) distance/time
        const meters =
          typeof distanceMeters === "number"
            ? distanceMeters
            : pathLengthMetersLonLat(coordsLonLat);
        setRouteMeters(meters);
        setRouteMinutes(minutesAtSpeed(meters));
      } catch (err) {
        if (err.name === "AbortError") return;
        console.warn("Route API failed; using straight-line fallback:", err);

        // Fallback: straight line between selected names
        const from = coordFromName(origin);
        const to = coordFromName(selected);
        if (!from || !to) return;

        const latlngs = [
          [from[1], from[0]],
          [to[1], to[0]],
        ];
        pathLineRef.current = L.polyline(latlngs, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.7,
          dashArray: "10, 5",
        }).addTo(map);

        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [60, 60] });

        const straight = haversineMeters(from, to);
        setRouteMeters(straight);
        setRouteMinutes(minutesAtSpeed(straight));
      }
    })();

    return () => ac.abort();
  }, [origin, selected, nodes]); // rerun when nodes map first loads

  /* ====== COURSES / SUMMARY (unchanged) ====== */
  function addCourse(e) {
    e?.preventDefault?.();
    const id = `${newCourse.name}-${Date.now()}`;
    setCourses((prev) => [...prev, { id, ...newCourse }]);
  }
  function removeCourse(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
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
      <aside 
        ref={sidebarRef}
        className="bg-white border-r shadow-lg overflow-hidden relative"
        style={{ 
          width: `${sidebarWidth}px`,
          minWidth: sidebarWidth === 0 ? '0px' : '200px',
          transition: isDragging ? 'none' : 'width 0.2s ease-out'
        }}
      >
        {sidebarWidth > 0 && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <span className="text-3xl">🦉</span>
              <div>
                <h1 className="text-2xl font-bold text-blue-800">Owl Map</h1>
                <p className="text-sm text-gray-600">Rice University Navigator</p>
              </div>
            </div>

            {/* Quick ETA */}
            <CollapsibleSection
              title="Quick Walk ETA"
              emoji="📍"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
              textColor="text-blue-800"
              isExpanded={sectionStates.walkEta}
              onToggle={() => toggleSection('walkEta')}
            >
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
                    {routeMeters != null ? `${routeMeters.toFixed(0)} ft` : "—"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Walk time:</span>{" "}
                    {routeMinutes != null ? `${routeMinutes.toFixed(1)} min` : "—"}
                  </p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Courses */}
            <CollapsibleSection
              title="Your Courses"
              emoji="📚"
              bgColor="bg-green-50"
              borderColor="border-green-200"
              textColor="text-green-800"
              isExpanded={sectionStates.courses}
              onToggle={() => toggleSection('courses')}
            >
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
                      className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={async () => {
                        const loc = await fetchCourseLocation(c.name);
                        if (loc) setSelected(loc); // Update Quick Walk ETA "To"
                        setOrigin(origin || nodes[0]?.name); // Optional: ensure origin is set
                      }}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.day} {c.start}-{c.end}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCourse(c.id); }}
                        className="text-red-600 text-sm hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>

            {/* Events */}
            <CollapsibleSection
              title="Campus Events"
              emoji="🎉"
              bgColor="bg-yellow-50"
              borderColor="border-yellow-200"
              textColor="text-yellow-800"
              isExpanded={sectionStates.events}
              onToggle={() => toggleSection('events')}
            >
              <div className="flex gap-1 mb-3">
                {[
                  { key: "today", label: "Today" },
                  { key: "upcoming", label: "Upcoming" },
                  { key: "all", label: "All" }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedEventDate(key)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedEventDate === key
                        ? "bg-yellow-200 text-yellow-800 border-yellow-300"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-yellow-100"
                    } border`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="bg-white border rounded-lg max-h-64 overflow-y-auto">
                {filteredEvents.length === 0 && (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    {selectedEventDate === "today" ? "No events today" : "No events found"}
                  </div>
                )}
                
                {filteredEvents.map((event) => {
                  const typeStyle = getEventTypeStyle(event.type);
                  const eventDate = new Date(event.date);
                  const isEventToday = isToday(event.date);
                  
                  return (
                    <div
                      key={event.id}
                      className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${typeStyle.dot}`}></div>
                            <h4 className="font-medium text-gray-900 text-sm leading-tight">
                              {event.name}
                            </h4>
                          </div>
                          
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span>📍 {event.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>🕒 {isEventToday ? "Today" : eventDate.toLocaleDateString("en-US", { 
                                month: "short", 
                                day: "numeric" 
                              })} • {formatEventTime(event.startTime, event.endTime)}</span>
                            </div>
                            {event.description && (
                              <div className="text-gray-500 text-xs mt-1">
                                {event.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                          {event.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 pt-3 border-t border-yellow-200">
               <a
                  href = "https://owlnest.rice.edu/events"
                  target = "_blank"
                  rel = "noopener noreferrer"
              >
                <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium bg-yellow-200 hover:bg-yellow-300 px-3 py-2 rounded transition-colors">
                  View Full Calendar →
                </button>
              </a>
            </div>
            </CollapsibleSection>

            {/* Serveries */}
            <CollapsibleSection
              title="Serveries & Hours"
              emoji="🍽️"
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              textColor="text-orange-800"
              isExpanded={sectionStates.serveries}
              onToggle={() => toggleSection('serveries')}
            >
              <div className="space-y-3">
                <div className="bg-white p-3 border rounded-lg">
                  <div className="font-medium text-orange-800 mb-2">South Servery</div>
                  <ul className="text-sm space-y-1">
                    <li className="text-black"><span className="font-bold text-gray-700">Mon-Fri:</span> 7:30 AM - 10:30 AM (Breakfast), 11:30 AM - 1:30 PM (Lunch), 2:00 PM - 4:00 PM (Munch), 4:00 PM - 5:00 PM (Snack), 5:30 PM - 9:00 PM (Extended Dinner)</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sat:</span> 8:00 AM - 11:00 AM (Breakfast), 11:30 AM - 2:00 PM (Lunch), 3:00 PM - 5:00 PM (Munch), 5:30 PM - 8:30 PM (Dinner)</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sun:</span> Closed</li>
                  </ul>
                </div>

                <div className="bg-white p-3 border rounded-lg">
                  <div className="font-medium text-orange-800 mb-2">North Servery</div>
                  <ul className="text-sm space-y-1">
                    <li className="text-black"><span className="font-bold text-gray-700">Mon-Fri:</span> 7:30 AM - 10:30 AM (Breakfast), 10:00 AM - 11:00 AM (Snack), 11:30 AM - 2:00 PM (Lunch), 5:00 PM - 8:00 PM (Dinner, Mon-Thu; Fri Dinner Closed)</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sat:</span> Closed</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sun:</span> 8:00 AM - 11:00 AM (Breakfast), 11:30 AM - 2:00 PM (Lunch), 3:00 PM - 5:00 PM (Munch), 5:30 PM - 8:30 PM (Dinner)</li>
                  </ul>
                </div>

                <div className="bg-white p-3 border rounded-lg">
                  <div className="font-medium text-orange-800 mb-2">Seibel Servery</div>
                  <ul className="text-sm space-y-1">
                    <li className="text-black"><span className="font-bold text-gray-700">Mon-Fri:</span> 7:30 AM - 10:00 AM (Enhanced Breakfast), 10:00 AM - 11:00 AM (Snack), 11:30 AM - 2:00 PM (Lunch), 5:00 PM - 8:00 PM (Dinner, Mon-Thu; Fri Dinner Closed)</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sat:</span> Closed</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sun:</span> 8:00 AM - 11:00 AM (Breakfast), 11:30 AM - 2:00 PM (Lunch), 3:00 PM - 5:00 PM (Munch), 5:30 PM - 8:30 PM (Dinner)</li>
                  </ul>
                </div>

                <div className="bg-white p-3 border rounded-lg">
                  <div className="font-medium text-orange-800 mb-2">West Servery</div>
                  <ul className="text-sm space-y-1">
                    <li className="text-black"><span className="font-bold text-gray-700">Mon-Fri:</span> 7:30 AM - 10:00 AM (Enhanced Breakfast), 11:30 AM - 1:30 PM (Lunch), 2:00 PM - 4:00 PM (Munch), 4:00 PM - 5:00 PM (Snack), 5:30 PM - 9:00 PM (Extended Dinner)</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sat:</span> 8:00 AM - 11:00 AM (Breakfast), 11:30 AM - 2:00 PM (Lunch), 3:00 PM - 5:00 PM (Munch), 5:30 PM - 8:30 PM (Dinner)</li>
                    <li className="text-black"><span className="font-bold text-gray-700">Sun:</span> Closed</li>
                  </ul>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}
        
        {/* Drag handle */}
        <div
          ref={dragRef}
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full bg-gray-300 hover:bg-gray-400 cursor-col-resize transition-colors z-10"
          style={{ 
            cursor: 'col-resize',
          }}
        >
          {/* Visual indicator for drag handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-500 rounded-full opacity-60"></div>
        </div>
      </aside>

      {/* Map */}
      <div 
        style={{ 
          flex: 1, 
          height: "100vh", 
          position: "relative",
          width: `calc(100vw - ${sidebarWidth}px)`,
        }}
      >
        <div
          ref={mapContainer}
          style={{ height: "100%", width: "100%", minHeight: "100vh" }}
        />
        
        {/* Show/Hide Sidebar Button when sidebar is hidden */}
        {sidebarWidth === 0 && (
          <button
            onClick={() => setSidebarWidth(400)}
            className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg border z-[1100] hover:bg-white transition-colors"
            title="Show Sidebar"
          >
            <span className="text-xl">🦉</span>
          </button>
        )}
        
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