"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Terminal, X, Shield, Lock, Unlock, Radio, Cpu, Sparkles } from "lucide-react";

interface Node04TerminalProps {
  onClose: () => void;
  artifactsCount: number;
  secretsCount: number;
}

export function Node04Terminal({ onClose, artifactsCount, secretsCount }: Node04TerminalProps) {
  const [commandInput, setCommandInput] = useState("");
  const [outputLogs, setOutputLogs] = useState<string[]>([
    "INITIALIZING NODE 04 SECURE TERMINAL...",
    "ACCESS LEVEL: RESTRICTED // DEEP SUB-LEVEL",
    `COLLECTIBLES VERIFIED: ${artifactsCount}/8`,
    `SECRETS VERIFIED: ${secretsCount}/4`,
    "TYPE 'help' FOR AVAILABLE COMMANDS OR 'unlock' TO BYPASS.",
  ]);

  const isUnlocked = artifactsCount >= 8 || secretsCount >= 2;

  // Handle ESC key to close terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    let response = `> ${commandInput}`;
    const newLogs = [...outputLogs, response];

    if (cmd === "help") {
      newLogs.push(
        "AVAILABLE COMMANDS:",
        "  status   - Check facility and node status",
        "  artifacts - View artifact discovery count",
        "  secrets   - View secret telemetry",
        "  override  - Attempt emergency protocol bypass",
        "  clear     - Clear terminal logs",
        "  exit      - Close terminal interface"
      );
    } else if (cmd === "status") {
      newLogs.push(
        `FACILITY: AMITDIED UNDERGROUND NODE 04`,
        `STATUS: ${isUnlocked ? "UNLOCKED // SYSTEM OVERRIDE READY" : "RESTRICTED // MORE ARTIFACTS REQUIRED"}`,
        `SECURITY LEVEL: ${isUnlocked ? "BYPASSED" : "MAXIMUM"}`
      );
    } else if (cmd === "artifacts") {
      newLogs.push(`DISCOVERED ARTIFACTS: ${artifactsCount} / 8 required for standard clearance.`);
    } else if (cmd === "secrets") {
      newLogs.push(`DISCOVERED SECRETS: ${secretsCount} / 4 recorded.`);
    } else if (cmd === "override" || cmd === "unlock") {
      if (isUnlocked) {
        newLogs.push("SUCCESS: NODE 04 PROTOCOL OVERRIDE ACCEPTED. WELCOME TO THE INNER SANCTUM.");
      } else {
        newLogs.push("ACCESS DENIED: Insufficient collectibles or secrets. Explore the facility to unlock.");
      }
    } else if (cmd === "clear") {
      setOutputLogs(["NODE 04 SECURE TERMINAL CLEARED."]);
      setCommandInput("");
      return;
    } else if (cmd === "exit") {
      onClose();
      return;
    } else {
      newLogs.push(`Command not recognized: '${commandInput}'. Type 'help' for valid commands.`);
    }

    setOutputLogs(newLogs);
    setCommandInput("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-World Node 04 Terminal"
      className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md select-none font-mono"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-zinc-950 border border-red-900/60 rounded-lg shadow-[0_0_60px_rgba(220,38,38,0.25)] overflow-hidden"
      >
        {/* CRT Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_3px] opacity-40 mix-blend-overlay" />

        {/* Top Bar */}
        <div className="relative z-40 px-4 sm:px-6 py-3.5 bg-black border-b border-red-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isUnlocked ? "bg-emerald-500 animate-pulse" : "bg-red-600 animate-ping"}`} />
            <div className="text-xs sm:text-sm font-bold tracking-[0.25em] text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span>NODE 04 <span className="text-red-500">{"// INNER SANCTUM"}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
            <span className={isUnlocked ? "text-emerald-400 font-bold" : "text-red-500 font-bold"}>
              {isUnlocked ? "ACCESS: UNLOCKED" : "ACCESS: RESTRICTED"}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Close Terminal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body / Logs */}
        <div className="relative z-40 flex-1 p-4 sm:p-6 overflow-y-auto space-y-2 text-xs sm:text-sm text-zinc-300 font-mono">
          <div className="border border-red-950/60 bg-red-950/10 p-3 rounded mb-4 text-[11px] text-red-400/90 tracking-wider">
            {isUnlocked
              ? "★ NODE 04 OVERRIDE GRANTED. YOU HAVE UNLOCKED THE SECRET INNER CHAMBER OF AMITDIED WORLD."
              : `🔒 RESTRICTED CHAMBER. DISCOVER ${8 - artifactsCount} MORE ARTIFACTS OR 2 SECRETS IN THE FACILITY TO GAIN ACCESS.`}
          </div>

          {outputLogs.map((log, index) => (
            <div key={index} className="leading-relaxed tracking-wider">
              {log.startsWith(">") ? (
                <span className="text-red-400 font-bold">{log}</span>
              ) : log.includes("SUCCESS") || log.includes("★") ? (
                <span className="text-emerald-400 font-bold">{log}</span>
              ) : log.includes("RESTRICTED") || log.includes("DENIED") ? (
                <span className="text-red-500">{log}</span>
              ) : (
                <span className="text-zinc-300">{log}</span>
              )}
            </div>
          ))}
        </div>

        {/* Command Input Bar */}
        <form onSubmit={handleCommandSubmit} className="relative z-40 p-3 sm:p-4 bg-black border-t border-red-950 flex items-center gap-2">
          <span className="text-red-500 font-bold text-xs sm:text-sm tracking-widest">node04$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type 'help' or 'unlock'..."
            className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-red-600 font-mono tracking-wider"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 hover:text-white rounded text-xs tracking-[0.2em] uppercase font-bold transition-colors cursor-pointer"
          >
            EXEC
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default Node04Terminal;
