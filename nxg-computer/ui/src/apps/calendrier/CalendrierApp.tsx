import React, { useContext, useMemo, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./CalendrierApp.scss";

type CalEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  note?: string;
};

const KEY = "nxg-calendar-v1";

function loadEvents(): CalEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return [
    {
      id: "e1",
      title: "Briefing RP",
      date: iso,
      time: "18:00",
      note: "Réunion équipe",
    },
  ];
}

function saveEvents(events: CalEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendrierApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.calendrier);
  const now = new Date();
  const [cursor, setCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [events, setEvents] = useState<CalEvent[]>(loadEvents);

  const selectedIso = isoDate(cursor.y, cursor.m, selectedDay);
  const dayEvents = useMemo(
    () => events.filter((e) => e.date === selectedIso).sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [events, selectedIso]
  );

  const cells = monthMatrix(cursor.y, cursor.m);
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const persist = (next: CalEvent[]) => {
    setEvents(next);
    saveEvents(next);
  };

  const addEvent = () => {
    const title = window.prompt("Titre de l’événement");
    if (!title?.trim()) return;
    const time = window.prompt("Heure (HH:MM)", "12:00") || undefined;
    const note = window.prompt("Note (optionnel)") || undefined;
    persist([
      ...events,
      {
        id: `e-${Date.now()}`,
        title: title.trim(),
        date: selectedIso,
        time: time?.trim() || undefined,
        note: note?.trim() || undefined,
      },
    ]);
  };

  const removeEvent = (id: string) => {
    persist(events.filter((e) => e.id !== id));
  };

  if (!open) return null;
  const closeApp = () =>
    dispatch({ type: "apps/CLOSE", payload: "calendrier" });

  return (
    <AppWindowShell
      appId="calendrier"
      handle=".cal-titlebar"
      defaultPosition={{ x: 140, y: 70 }}
      windowClassName="calendrier-window"
      windowId="calendrier-window"
    >
      <div
        className="cal-hit"
        onMouseDown={() =>
          dispatch({ type: "onTop/SET", payload: "calendrier" })
        }
      >
        <header className="cal-titlebar">
          <TrafficLights appId="calendrier" onClose={closeApp} />
          <div className="cal-title">Calendrier</div>
          <button type="button" className="cal-add" onClick={addEvent}>
            + Événement
          </button>
        </header>
        <div className="cal-body">
          <section className="cal-month">
            <div className="cal-month-head">
              <button
                type="button"
                onClick={() =>
                  setCursor((c) => {
                    const m = c.m - 1;
                    return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m };
                  })
                }
              >
                ‹
              </button>
              <strong>{title}</strong>
              <button
                type="button"
                onClick={() =>
                  setCursor((c) => {
                    const m = c.m + 1;
                    return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m };
                  })
                }
              >
                ›
              </button>
            </div>
            <div className="cal-weekdays">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((d, i) => {
                if (d == null) return <span key={i} className="cal-cell empty" />;
                const iso = isoDate(cursor.y, cursor.m, d);
                const has = events.some((e) => e.date === iso);
                const isSel = d === selectedDay;
                const isToday =
                  d === now.getDate() &&
                  cursor.m === now.getMonth() &&
                  cursor.y === now.getFullYear();
                return (
                  <button
                    key={i}
                    type="button"
                    className={`cal-cell ${isSel ? "sel" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => setSelectedDay(d)}
                  >
                    {d}
                    {has ? <i /> : null}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="cal-agenda">
            <h2>
              {new Date(selectedIso).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            {dayEvents.length === 0 ? (
              <div className="cal-empty">Aucun événement</div>
            ) : (
              <ul>
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <div>
                      <strong>
                        {e.time ? `${e.time} · ` : ""}
                        {e.title}
                      </strong>
                      {e.note ? <span>{e.note}</span> : null}
                    </div>
                    <button type="button" onClick={() => removeEvent(e.id)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppWindowShell>
  );
}
