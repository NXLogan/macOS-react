import React, { useContext, useEffect, useMemo, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./NotesApp.scss";

type Note = {
  id: string;
  folderId: string;
  title: string;
  body: string;
  updatedAt: number;
  pinned?: boolean;
};

type Folder = { id: string; name: string };

const KEY = "nxg-notes-v1";

const DEFAULT_FOLDERS: Folder[] = [
  { id: "notes", name: "Notes" },
  { id: "rapides", name: "Notes rapides" },
  { id: "travail", name: "Travail" },
];

function load(): { folders: Folder[]; notes: Note[] } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const now = Date.now();
  return {
    folders: DEFAULT_FOLDERS,
    notes: [
      {
        id: "n1",
        folderId: "notes",
        title: "Bienvenue sur Notes",
        body: "Écris ici tes notes RP.\n\n• Double-clique une note pour l’ouvrir\n• Utilise + pour en créer une",
        updatedAt: now,
        pinned: true,
      },
    ],
  };
}

function save(data: { folders: Folder[]; notes: Note[] }) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function titleFromBody(body: string) {
  const line = body.split("\n").find((l) => l.trim()) || "Nouvelle note";
  return line.trim().slice(0, 48);
}

export default function NotesApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.notes);
  const [data, setData] = useState(load);
  const [folderId, setFolderId] = useState("notes");
  const [selectedId, setSelectedId] = useState<string | null>(
    data.notes[0]?.id ?? null
  );

  useEffect(() => {
    if (open) setData(load());
  }, [open]);

  const persist = (next: typeof data) => {
    setData(next);
    save(next);
  };

  const folderNotes = useMemo(() => {
    const list = data.notes
      .filter((n) => n.folderId === folderId)
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    return list;
  }, [data.notes, folderId]);

  const selected = data.notes.find((n) => n.id === selectedId) || null;

  const createNote = () => {
    const note: Note = {
      id: `n-${Date.now()}`,
      folderId,
      title: "Nouvelle note",
      body: "",
      updatedAt: Date.now(),
    };
    persist({ ...data, notes: [note, ...data.notes] });
    setSelectedId(note.id);
  };

  const updateBody = (body: string) => {
    if (!selected) return;
    persist({
      ...data,
      notes: data.notes.map((n) =>
        n.id === selected.id
          ? {
              ...n,
              body,
              title: titleFromBody(body),
              updatedAt: Date.now(),
            }
          : n
      ),
    });
  };

  const trashNote = () => {
    if (!selected) return;
    const next = data.notes.filter((n) => n.id !== selected.id);
    persist({ ...data, notes: next });
    setSelectedId(next.find((n) => n.folderId === folderId)?.id ?? null);
  };

  const addFolder = () => {
    const name = window.prompt("Nom du dossier", "Nouveau dossier");
    if (!name?.trim()) return;
    const folder: Folder = { id: `f-${Date.now()}`, name: name.trim() };
    persist({ ...data, folders: [...data.folders, folder] });
    setFolderId(folder.id);
  };

  if (!open) return null;

  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "notes" });

  const pinned = folderNotes.filter((n) => n.pinned);
  const rest = folderNotes.filter((n) => !n.pinned);

  return (
    <AppWindowShell
      appId="notes"
      handle=".notes-drag"
      defaultPosition={{ x: 120, y: 56 }}
      windowClassName="notes-window"
      windowId="notes-window"
    >
      <div
        className="notes-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "notes" })}
      >
        <div className="notes-sidebar">
          <div className="notes-drag notes-traffic">
            <TrafficLights appId="notes" onClose={closeApp} />
          </div>
          <div className="notes-side-section">Dossiers</div>
          {data.folders.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`notes-folder ${folderId === f.id ? "active" : ""}`}
              onClick={() => {
                setFolderId(f.id);
                const first = data.notes.find((n) => n.folderId === f.id);
                setSelectedId(first?.id ?? null);
              }}
            >
              <span>📁</span>
              <span className="notes-folder-name">{f.name}</span>
              <span className="notes-folder-count">
                {data.notes.filter((n) => n.folderId === f.id).length}
              </span>
            </button>
          ))}
          <button type="button" className="notes-new-folder" onClick={addFolder}>
            + Nouveau dossier
          </button>
        </div>

        <div className="notes-list-pane">
          <div className="notes-list-toolbar notes-drag">
            <button type="button" className="notes-tool" onClick={trashNote} title="Supprimer">
              🗑
            </button>
            <button type="button" className="notes-tool accent" onClick={createNote} title="Nouvelle note">
              ✎
            </button>
          </div>
          <div className="notes-list-scroll">
            {pinned.length > 0 && (
              <>
                <div className="notes-group">Épinglées</div>
                {pinned.map((n) => (
                  <NoteRow
                    key={n.id}
                    note={n}
                    active={n.id === selectedId}
                    onSelect={() => setSelectedId(n.id)}
                  />
                ))}
              </>
            )}
            {rest.length > 0 && (
              <>
                <div className="notes-group">Notes</div>
                {rest.map((n) => (
                  <NoteRow
                    key={n.id}
                    note={n}
                    active={n.id === selectedId}
                    onSelect={() => setSelectedId(n.id)}
                  />
                ))}
              </>
            )}
            {folderNotes.length === 0 && (
              <div className="notes-empty-list">Aucune note</div>
            )}
          </div>
        </div>

        <div className="notes-editor">
          {selected ? (
            <>
              <div className="notes-editor-meta">
                {new Date(selected.updatedAt).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <textarea
                className="notes-textarea"
                value={selected.body}
                placeholder="Commence à écrire…"
                onChange={(e) => updateBody(e.target.value)}
              />
            </>
          ) : (
            <div className="notes-empty-editor">Sélectionne ou crée une note</div>
          )}
        </div>
      </div>
    </AppWindowShell>
  );
}

function NoteRow({
  note,
  active,
  onSelect,
}: {
  note: Note;
  active: boolean;
  onSelect: () => void;
}) {
  const snip = note.body.replace(/\n/g, " ").trim().slice(0, 60);
  return (
    <button
      type="button"
      className={`notes-row ${active ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="notes-row-title">{note.title || "Sans titre"}</div>
      <div className="notes-row-sub">
        <span>
          {new Date(note.updatedAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        {snip ? ` — ${snip}` : ""}
      </div>
    </button>
  );
}
