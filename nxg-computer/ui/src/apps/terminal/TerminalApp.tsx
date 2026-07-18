import React, { useContext, useEffect, useRef, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import "./TerminalApp.scss";

type Line = { kind: "in" | "out" | "sys"; text: string };

const BANNER = [
  "NXGos Terminal v2.4 — shell sécurisé (RP)",
  "Tape `help` pour la liste des commandes.",
].join("\n");

function runCommand(raw: string, userName: string): string {
  const input = raw.trim();
  if (!input) return "";
  const [cmd, ...args] = input.split(/\s+/);
  const a = args.join(" ");

  switch (cmd.toLowerCase()) {
    case "help":
      return [
        "Commandes :",
        "  help, clear, whoami, hostname, date, echo",
        "  ls, pwd, neofetch, scan, hack, connect, crack",
        "  ip, ping, matrix",
      ].join("\n");
    case "clear":
      return "__CLEAR__";
    case "whoami":
      return userName || "nxg-user";
    case "hostname":
      return "NXG-PC";
    case "pwd":
      return "/Users/" + (userName || "nxg").replace(/\s+/g, "").toLowerCase();
    case "date":
      return new Date().toLocaleString("fr-FR");
    case "echo":
      return a;
    case "ls":
      return "Documents  Downloads  Desktop  .ssh  secrets.enc  tools/";
    case "ip":
      return "eth0: 192.168.1." + (20 + Math.floor(Math.random() * 200));
    case "neofetch":
      return [
        "          .:/+oossssoo+/:`          " + (userName || "nxg") + "@NXG-PC",
        "      `:+ssssssssssssssssss+:`      ------------------",
        "    -+ssssssssssssssssssyyssss+-    OS: NXGos 14 RP",
        "  .ossssssssssssssssssdMMMNysssso.  Host: Los Santos Terminal",
        " /ssssssssssshdmmNNmmyNMMMMhssssss/ Kernel: 6.9.0-nxg",
        "+ssssssssshmydMMMMMMMNddddyssssssss Uptime: 4h 12m",
        " Shell: zsh  Theme: hacker-green",
      ].join("\n");
    case "scan":
      return [
        `[scan] cible: ${a || "192.168.1.0/24"}`,
        "  22/tcp   open   ssh",
        "  80/tcp   open   http",
        "  443/tcp  open   https",
        "  3306/tcp filtered mysql",
        "Scan terminé — 4 ports intéressants.",
      ].join("\n");
    case "hack":
    case "crack":
      return [
        `[*] Initialisation du module ${cmd}…`,
        `[*] Cible: ${a || "firewall-cityhall.ls"}`,
        "[*] Brute-force… ████████░░ 82%",
        "[+] Accès obtenu (simulation RP).",
        "[!] Aucune donnée réelle modifiée.",
      ].join("\n");
    case "connect":
      return a
        ? `[+] Session SSH ouverte vers ${a}\nroot@${a}:~#`
        : "usage: connect <host>";
    case "ping":
      return a
        ? `PING ${a}: 64 bytes ttl=54 time=${(Math.random() * 40 + 8).toFixed(1)} ms\n--- ${a} ping statistics ---\n4 packets transmitted, 4 received`
        : "usage: ping <host>";
    case "matrix":
      return Array.from({ length: 8 }, () =>
        Array.from({ length: 42 }, () =>
          "01アイウエ"[Math.floor(Math.random() * 8)]
        ).join("")
      ).join("\n");
    default:
      return `zsh: command not found: ${cmd}`;
  }
}

export default function TerminalApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.terminal);
  const userName = state.user?.name || "nxg";
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: BANNER },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    const raw = input;
    const prompt = `${userName.toLowerCase().replace(/\s+/g, "")}@nxg ~ % `;
    const out = runCommand(raw, userName);
    if (out === "__CLEAR__") {
      setLines([]);
      setInput("");
      return;
    }
    setLines((prev) => [
      ...prev,
      { kind: "in", text: prompt + raw },
      ...(out ? [{ kind: "out" as const, text: out }] : []),
    ]);
    if (raw.trim()) setHistory((h) => [...h, raw]);
    setHistIdx(-1);
    setInput("");
  };

  if (!open) return null;
  const closeApp = () => dispatch({ type: "apps/CLOSE", payload: "terminal" });

  return (
    <AppWindowShell
      appId="terminal"
      handle=".terminal-titlebar"
      defaultPosition={{ x: 160, y: 90 }}
      windowClassName="terminal-window"
      windowId="terminal-window"
    >
      <div
        className="terminal-hit"
        onMouseDown={() => {
          dispatch({ type: "onTop/SET", payload: "terminal" });
          inputRef.current?.focus();
        }}
      >
        <header className="terminal-titlebar">
          <TrafficLights appId="terminal" onClose={closeApp} />
          <div className="terminal-title">
            {userName} — zsh — nxg-computer
          </div>
        </header>
        <div className="terminal-body">
          {lines.map((l, i) => (
            <pre key={i} className={`term-line kind-${l.kind}`}>
              {l.text}
            </pre>
          ))}
          <div className="term-input-row">
            <span className="term-prompt">
              {userName.toLowerCase().replace(/\s+/g, "")}@nxg ~ %
            </span>
            <input
              ref={inputRef}
              value={input}
              spellCheck={false}
              autoCapitalize="off"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (!history.length) return;
                  const next =
                    histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
                  setHistIdx(next);
                  setInput(history[next] || "");
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (histIdx < 0) return;
                  const next = histIdx + 1;
                  if (next >= history.length) {
                    setHistIdx(-1);
                    setInput("");
                  } else {
                    setHistIdx(next);
                    setInput(history[next] || "");
                  }
                }
              }}
            />
          </div>
          <div ref={endRef} />
        </div>
      </div>
    </AppWindowShell>
  );
}
