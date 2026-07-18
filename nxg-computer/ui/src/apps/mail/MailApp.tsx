import React, { useContext, useMemo, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./MailApp.scss";

type MailMsg = {
  id: string;
  folder: "inbox" | "sent" | "drafts";
  from: string;
  to: string;
  subject: string;
  body: string;
  at: number;
  unread?: boolean;
};

const KEY = "nxg-mail-v1";

function seed(): MailMsg[] {
  const now = Date.now();
  return [
    {
      id: "m1",
      folder: "inbox",
      from: "lspd@city.ls",
      to: "toi@nxg.mail",
      subject: "Convocation — dépôt de plainte",
      body: "Bonjour,\n\nMerci de vous présenter au commissariat sous 48h.\n\n— LSPD",
      at: now - 3600_000,
      unread: true,
    },
    {
      id: "m2",
      folder: "inbox",
      from: "banque@fleeca.ls",
      to: "toi@nxg.mail",
      subject: "Relevé de compte",
      body: "Votre solde disponible a été mis à jour.\nConsultez l’app Banque pour plus de détails.",
      at: now - 86400_000,
    },
    {
      id: "m3",
      folder: "sent",
      from: "toi@nxg.mail",
      to: "boss@entreprise.ls",
      subject: "Rapport du soir",
      body: "Tout est clean de mon côté. On reste en contact.",
      at: now - 7200_000,
    },
  ];
}

function load(): MailMsg[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return seed();
}

function save(msgs: MailMsg[]) {
  localStorage.setItem(KEY, JSON.stringify(msgs));
}

export default function MailApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.mail);
  const userMail = `${(state.user?.name || "nxg")
    .toLowerCase()
    .replace(/\s+/g, ".")}@nxg.mail`;
  const [msgs, setMsgs] = useState<MailMsg[]>(load);
  const [folder, setFolder] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", body: "" });

  const list = useMemo(
    () =>
      msgs
        .filter((m) => m.folder === folder)
        .sort((a, b) => b.at - a.at),
    [msgs, folder]
  );
  const selected = msgs.find((m) => m.id === selectedId) || null;

  const persist = (next: MailMsg[]) => {
    setMsgs(next);
    save(next);
  };

  const openMsg = (id: string) => {
    setSelectedId(id);
    setComposing(false);
    persist(
      msgs.map((m) => (m.id === id ? { ...m, unread: false } : m))
    );
  };

  const sendMail = () => {
    if (!draft.to.trim() || !draft.subject.trim()) {
      window.alert("Destinataire et objet requis");
      return;
    }
    const msg: MailMsg = {
      id: `m-${Date.now()}`,
      folder: "sent",
      from: userMail,
      to: draft.to.trim(),
      subject: draft.subject.trim(),
      body: draft.body,
      at: Date.now(),
    };
    persist([msg, ...msgs]);
    setDraft({ to: "", subject: "", body: "" });
    setComposing(false);
    setFolder("sent");
    setSelectedId(msg.id);
  };

  if (!open) return null;
  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "mail" });

  return (
    <AppWindowShell
      appId="mail"
      handle=".mail-titlebar"
      defaultPosition={{ x: 100, y: 55 }}
      windowClassName="mail-window"
      windowId="mail-window"
    >
      <div
        className="mail-hit"
        onMouseDown={() => dispatch({ type: "onTop/SET", payload: "mail" })}
      >
        <header className="mail-titlebar">
          <TrafficLights appId="mail" onClose={closeApp} />
          <div className="mail-title">Mail</div>
          <button
            type="button"
            className="mail-compose-btn"
            onClick={() => {
              setComposing(true);
              setSelectedId(null);
            }}
          >
            Nouveau
          </button>
        </header>
        <div className="mail-body">
          <aside className="mail-side">
            {(
              [
                ["inbox", "Boîte de réception"],
                ["sent", "Envoyés"],
                ["drafts", "Brouillons"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={folder === id ? "active" : ""}
                onClick={() => {
                  setFolder(id);
                  setComposing(false);
                  setSelectedId(null);
                }}
              >
                {label}
                <span>
                  {msgs.filter((m) => m.folder === id && m.unread).length ||
                    msgs.filter((m) => m.folder === id).length}
                </span>
              </button>
            ))}
            <div className="mail-addr">{userMail}</div>
          </aside>
          <div className="mail-list">
            {list.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mail-row ${selectedId === m.id ? "sel" : ""} ${
                  m.unread ? "unread" : ""
                }`}
                onClick={() => openMsg(m.id)}
              >
                <div className="mail-row-from">
                  {folder === "sent" ? m.to : m.from}
                </div>
                <div className="mail-row-sub">{m.subject}</div>
                <div className="mail-row-date">
                  {new Date(m.at).toLocaleDateString("fr-FR")}
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <div className="mail-empty">Aucun message</div>
            )}
          </div>
          <div className="mail-reader">
            {composing ? (
              <div className="mail-compose">
                <input
                  placeholder="À :"
                  value={draft.to}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                />
                <input
                  placeholder="Objet :"
                  value={draft.subject}
                  onChange={(e) =>
                    setDraft({ ...draft, subject: e.target.value })
                  }
                />
                <textarea
                  placeholder="Écrire le message…"
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
                <div className="mail-compose-actions">
                  <button type="button" onClick={sendMail}>
                    Envoyer
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setComposing(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : selected ? (
              <>
                <h2>{selected.subject}</h2>
                <div className="mail-meta">
                  De : {selected.from}
                  <br />
                  À : {selected.to}
                  <br />
                  {new Date(selected.at).toLocaleString("fr-FR")}
                </div>
                <pre className="mail-body-text">{selected.body}</pre>
              </>
            ) : (
              <div className="mail-empty">Sélectionne un message</div>
            )}
          </div>
        </div>
      </div>
    </AppWindowShell>
  );
}
