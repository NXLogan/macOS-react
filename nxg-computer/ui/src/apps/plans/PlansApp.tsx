import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./PlansApp.scss";

/** Public assets: ui/public/maps/gta (TGRHavoc LiveMap minimap_sea tiles). */
const TILE_SIZE = 1024;
const TILE_BASE = `${process.env.PUBLIC_URL || "."}/maps/gta`;

/** Calibration anchors from TGRHavoc live_map-interface (GTA world → Leaflet). */
const GAME_1 = { x: -4000 - 230, y: 8000 + 420 };
const GAME_2 = { x: 400 - 30, y: -300 - 340 };

type Place = {
  id: string;
  name: string;
  /** In-game GTA V / FiveM world X */
  x: number;
  /** In-game GTA V / FiveM world Y */
  y: number;
  blurb: string;
};

const PLACES: Place[] = [
  {
    id: "maze",
    name: "Maze Bank",
    x: -75,
    y: -818,
    blurb: "Centre-ville — tour Maze Bank.",
  },
  {
    id: "mission",
    name: "Mission Row",
    x: 428,
    y: -981,
    blurb: "Commissariat LSPD.",
  },
  {
    id: "vinewood",
    name: "Vinewood",
    x: 298,
    y: 178,
    blurb: "Collines & panneau Vinewood.",
  },
  {
    id: "mirror",
    name: "Mirror Park",
    x: 1125,
    y: -645,
    blurb: "Quartier résidentiel est.",
  },
  {
    id: "sandy",
    name: "Sandy Shores",
    x: 1961,
    y: 3749,
    blurb: "Désert — aérodrome & trailer park.",
  },
  {
    id: "paleto",
    name: "Paleto Bay",
    x: -109,
    y: 6465,
    blurb: "Petite ville du nord.",
  },
  {
    id: "chumash",
    name: "Chumash",
    x: -3172,
    y: 1100,
    blurb: "Côte ouest.",
  },
  {
    id: "airport",
    name: "LSIA",
    x: -1037,
    y: -2738,
    blurb: "Aéroport international de Los Santos.",
  },
  {
    id: "docks",
    name: "Terminal",
    x: 1005,
    y: -3090,
    blurb: "Docks industriels.",
  },
  {
    id: "casino",
    name: "Diamond Casino",
    x: 925,
    y: 47,
    blurb: "Casino & hôtel.",
  },
];

function gtaToLatLng(map: L.Map, x: number, y: number): L.LatLng {
  const h = TILE_SIZE * 3;
  const w = TILE_SIZE * 2;
  const latLng1 = map.unproject([0, 0], 0);
  const latLng2 = map.unproject([w / 2, h - TILE_SIZE], 0);
  const lng =
    latLng1.lng +
    ((x - GAME_1.x) * (latLng1.lng - latLng2.lng)) / (GAME_1.x - GAME_2.x);
  const lat =
    latLng1.lat +
    ((y - GAME_1.y) * (latLng1.lat - latLng2.lat)) / (GAME_1.y - GAME_2.y);
  return L.latLng(lat, lng);
}

function mapBounds(map: L.Map) {
  const h = TILE_SIZE * 3;
  const w = TILE_SIZE * 2;
  const southWest = map.unproject([0, h], 0);
  const northEast = map.unproject([w, 0], 0);
  return L.latLngBounds(southWest, northEast);
}

const pinIcon = L.divIcon({
  className: "plans-leaflet-pin",
  html: '<span class="plans-pin-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const pinIconOn = L.divIcon({
  className: "plans-leaflet-pin on",
  html: '<span class="plans-pin-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function PlansApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.plans);
  const [selected, setSelected] = useState<Place | null>(PLACES[0]);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const filtered = useMemo(
    () =>
      PLACES.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query]
  );

  const flyTo = (place: Place) => {
    const map = mapRef.current;
    if (!map) return;
    const ll = gtaToLatLng(map, place.x, place.y);
    map.flyTo(ll, Math.max(map.getZoom(), 1), { duration: 0.55 });
    setSelected(place);
  };

  useEffect(() => {
    if (!open || !mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      crs: L.CRS.Simple,
      zoomControl: false,
      attributionControl: false,
      minZoom: -3,
      maxZoom: 3,
    });

    const layer = L.tileLayer(`${TILE_BASE}/minimap_sea_{y}_{x}.png`, {
      minZoom: -3,
      maxZoom: 3,
      tileSize: TILE_SIZE,
      maxNativeZoom: 0,
      minNativeZoom: 0,
      noWrap: true,
      errorTileUrl:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    });
    layer.addTo(map);

    const bounds = mapBounds(map);
    map.setMaxBounds(bounds.pad(0.35));
    map.fitBounds(bounds);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    PLACES.forEach((place) => {
      const marker = L.marker(gtaToLatLng(map, place.x, place.y), {
        icon: place.id === selectedRef.current?.id ? pinIconOn : pinIcon,
        title: place.name,
      })
        .addTo(map)
        .bindTooltip(place.name, { direction: "top", offset: [0, -8] });
      marker.on("click", () => {
        setSelected(place);
        map.panTo(marker.getLatLng());
      });
      markersRef.current.set(place.id, marker);
    });

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      const h = TILE_SIZE * 3;
      const w = TILE_SIZE * 2;
      const latLng1 = map.unproject([0, 0], 0);
      const latLng2 = map.unproject([w / 2, h - TILE_SIZE], 0);
      const x =
        GAME_1.x +
        ((e.latlng.lng - latLng1.lng) * (GAME_1.x - GAME_2.x)) /
          (latLng1.lng - latLng2.lng);
      const y =
        GAME_1.y +
        ((e.latlng.lat - latLng1.lat) * (GAME_1.y - GAME_2.y)) /
          (latLng1.lat - latLng2.lat);
      setCoords({ x: Math.round(x), y: Math.round(y) });
    });

    mapRef.current = map;

    const t = window.setTimeout(() => map.invalidateSize(), 80);
    const t2 = window.setTimeout(() => map.invalidateSize(), 320);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const map = mapRef.current;
    if (!map) return;
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    const id = window.setInterval(() => map.invalidateSize(), 600);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearInterval(id);
    };
  }, [open]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(id === selected?.id ? pinIconOn : pinIcon);
    });
  }, [selected]);

  if (!open) return null;
  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "plans" });

  return (
    <AppWindowShell
      appId="plans"
      handle=".plans-titlebar"
      defaultPosition={{ x: 90, y: 60 }}
      windowClassName="plans-window"
      windowId="plans-window"
    >
      <div
        className="plans-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "plans" })}
      >
        <header className="plans-titlebar">
          <TrafficLights appId="plans" onClose={closeApp} />
          <div className="plans-title">Plans — Los Santos</div>
        </header>
        <div className="plans-body">
          <aside className="plans-side">
            <input
              className="plans-search"
              placeholder="Rechercher un lieu…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="plans-places">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={selected?.id === p.id ? "active" : ""}
                  onClick={() => flyTo(p)}
                >
                  <strong>{p.name}</strong>
                  <span>{p.blurb}</span>
                </button>
              ))}
            </div>
            <div className="plans-coords">
              Coords GTA · X {coords.x} · Y {coords.y}
            </div>
          </aside>
          <div className="plans-viewport">
            <div ref={mapEl} className="plans-leaflet" />
            {selected && (
              <div className="plans-card">
                <strong>{selected.name}</strong>
                <p>{selected.blurb}</p>
                <code>
                  X {selected.x.toFixed(0)} · Y {selected.y.toFixed(0)}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppWindowShell>
  );
}
