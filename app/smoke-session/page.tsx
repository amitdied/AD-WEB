"use client";

import { useState, useRef, useEffect } from "react";

type Character = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  special: string;
};

type Enemy = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
};

type Item = {
  id: string;
  name: string;
  effect: string;
  value: number;
};

const HEROES: Character[] = [
  { id: "amit", name: "AMITDIED", hp: 120, maxHp: 120, atk: 18, def: 12, speed: 14, special: "Focus" },
  { id: "chiku", name: "CHIKU", hp: 95, maxHp: 95, atk: 22, def: 8, speed: 18, special: "Chaos" },
  { id: "sahil", name: "SAHIL", hp: 100, maxHp: 100, atk: 14, def: 11, speed: 16, special: "Analyze" },
  { id: "addy", name: "ADDY", hp: 150, maxHp: 150, atk: 16, def: 18, speed: 10, special: "Guard" },
];

const ZONES = [
  { id: "block", name: "THE BLOCK", desc: "Your starting ground" },
  { id: "dealer", name: "DEALER CORNER", desc: "Business first" },
  { id: "rooftop", name: "THE ROOFTOP", desc: "Link up with the crew" },
];

export default function SmokeSessionPage() {
  // Video session state
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Game state
  const [mode, setMode] = useState<"session" | "game">("session");
  const [screen, setScreen] = useState<"start" | "map" | "combat" | "end">("start");
  const [zoneIndex, setZoneIndex] = useState(0);
  const [party, setParty] = useState<Character[]>([{ ...HEROES[0] }]);
  const [inventory, setInventory] = useState<Item[]>([
    { id: "pain", name: "Painkiller", effect: "heal", value: 40 },
  ]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [activeHero, setActiveHero] = useState(0);
  const [focusActive, setFocusActive] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isPlaying]);

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 6));

  const startGame = () => {
    setMode("game");
    setScreen("start");
    setZoneIndex(0);
    setParty([{ ...HEROES[0] }]);
    setInventory([{ id: "pain", name: "Painkiller", effect: "heal", value: 40 }]);
    setLog(["Night starts. Move carefully."]);
    setIsPlaying(false);
  };

  const exitGame = () => {
    setMode("session");
    setScreen("start");
  };

  const beginNight = () => {
    setScreen("map");
  };

  const moveToZone = (index: number) => {
    setZoneIndex(index);
    if (index === 1) {
      setEnemies([{ id: "e1", name: "Street Opp", hp: 60, maxHp: 60, atk: 12, def: 6 }]);
      setScreen("combat");
      addLog("Someone steps up at the corner.");
    } else if (index === 2) {
      setParty(HEROES.map((h) => ({ ...h })));
      setEnemies([
        { id: "e1", name: "Street Opp", hp: 55, maxHp: 55, atk: 11, def: 5 },
        { id: "e2", name: "Street Opp", hp: 55, maxHp: 55, atk: 11, def: 5 },
      ]);
      setScreen("combat");
      addLog("Crew is here. Trouble follows.");
    }
  };

  const attack = () => {
    const livingEnemies = enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length === 0) return;

    const hero = party[activeHero];
    const target = livingEnemies[0];
    let dmg = Math.max(5, hero.atk - target.def + Math.floor(Math.random() * 6));
    if (focusActive) {
      dmg *= 2;
      setFocusActive(false);
      addLog("Focus activated.");
    }
    if (analyzed) {
      dmg = Math.floor(dmg * 1.3);
      setAnalyzed(false);
    }

    const newEnemies = enemies.map((e) =>
      e.id === target.id ? { ...e, hp: Math.max(0, e.hp - dmg) } : e
    );
    setEnemies(newEnemies);
    addLog(`${hero.name} hits ${target.name} for ${dmg}`);

    if (newEnemies.every((e) => e.hp <= 0)) {
      addLog("Fight over.");
      if (zoneIndex >= 2) {
        setScreen("end");
      } else {
        setScreen("map");
        setInventory((prev) => [
          ...prev,
          { id: `pain-${Date.now()}`, name: "Painkiller", effect: "heal", value: 40 },
        ]);
      }
      return;
    }

    setTimeout(() => enemyTurn(newEnemies), 600);
  };

  const enemyTurn = (currentEnemies: Enemy[]) => {
    const alive = currentEnemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return;

    const enemy = alive[0];
    const targetIndex = party.findIndex((p) => p.hp > 0);
    if (targetIndex === -1) {
      addLog("Crew is down...");
      setScreen("end");
      return;
    }

    const target = party[targetIndex];
    const dmg = Math.max(4, enemy.atk - target.def + Math.floor(Math.random() * 5));
    setParty((prev) =>
      prev.map((p, i) => (i === targetIndex ? { ...p, hp: Math.max(0, p.hp - dmg) } : p))
    );
    addLog(`${enemy.name} hits ${target.name} for ${dmg}`);
  };

  const useSpecial = () => {
    const hero = party[activeHero];
    if (hero.id === "amit") {
      setFocusActive(true);
      addLog("AMITDIED prepares Focus.");
    } else if (hero.id === "chiku") {
      const target = enemies.find((e) => e.hp > 0);
      if (!target) return;
      const dmg = 15 + Math.floor(Math.random() * 21);
      setEnemies((prev) =>
        prev.map((e) => (e.id === target.id ? { ...e, hp: Math.max(0, e.hp - dmg) } : e))
      );
      addLog(`CHIKU Chaos hits for ${dmg}`);
    } else if (hero.id === "sahil") {
      setAnalyzed(true);
      addLog("SAHIL analyzes the target.");
    } else {
      addLog("ADDY guards the crew.");
    }
    setTimeout(() => enemyTurn(enemies), 500);
  };

  const useItem = (item: Item) => {
    if (item.effect === "heal") {
      setParty((prev) =>
        prev.map((p, i) =>
          i === activeHero ? { ...p, hp: Math.min(p.maxHp, p.hp + item.value) } : p
        )
      );
      addLog(`Used ${item.name}`);
    }
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
  };

  // ===================== VIDEO SESSION (default) =====================
  if (mode === "session") {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
        <a
          href="/"
          className="absolute top-6 left-6 text-sm tracking-widest uppercase hover:text-red-500 transition-colors z-50"
        >
          ← Back
        </a>

        {/* Hidden corner game entrance */}
        <button
          onClick={startGame}
          className="absolute bottom-6 right-6 text-[10px] tracking-[0.25em] uppercase text-zinc-600 hover:text-red-500 transition-colors z-50"
        >
          // NIGHT
        </button>

        <div className="relative flex flex-col items-center">
          <video
            ref={videoRef}
            src="/smoking-loop.mp4"
            muted
            loop
            playsInline
            className="w-full max-w-[420px] h-auto object-contain"
            style={{ maxHeight: "70vh" }}
          />

          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className={`mt-10 px-8 py-3 text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 border ${
              isPlaying
                ? "border-orange-500 text-orange-400 hover:bg-orange-500/10"
                : "border-white/40 text-white hover:border-white hover:bg-white/5"
            }`}
          >
            {isPlaying ? "PUT OUT" : "MAKE HIM SMOKE"}
          </button>
        </div>
      </div>
    );
  }

  // ===================== GAME =====================
  if (screen === "start") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">
        <button
          onClick={exitGame}
          className="absolute top-6 left-6 text-xs tracking-widest uppercase hover:text-red-500"
        >
          ← Back to Session
        </button>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4">AMITDIED</h1>
        <p className="text-red-600 tracking-[0.3em] text-sm mb-10">NIGHT SESSION</p>
        <button
          onClick={beginNight}
          className="px-10 py-4 border border-white/30 hover:border-red-600 hover:text-red-500 tracking-[0.25em] text-xs uppercase transition-all"
        >
          Enter The Night
        </button>
      </div>
    );
  }

  if (screen === "map") {
    const zone = ZONES[zoneIndex];
    return (
      <div className="min-h-screen bg-black text-white p-6 relative">
        <button
          onClick={exitGame}
          className="absolute top-6 left-6 text-xs tracking-widest uppercase hover:text-red-500"
        >
          ← Back to Session
        </button>
        <div className="max-w-xl mx-auto mt-16">
          <h2 className="text-3xl font-black tracking-tighter mb-2">{zone.name}</h2>
          <p className="text-zinc-500 text-sm mb-8">{zone.desc}</p>

          <div className="space-y-3 mb-10">
            {ZONES.map((z, i) => (
              <button
                key={z.id}
                disabled={i < zoneIndex}
                onClick={() => moveToZone(i)}
                className={`w-full text-left px-5 py-4 border transition-all ${
                  i === zoneIndex
                    ? "border-red-600 bg-red-950/20"
                    : i < zoneIndex
                    ? "border-zinc-800 text-zinc-600"
                    : "border-zinc-700 hover:border-red-600"
                }`}
              >
                <div className="text-xs tracking-widest uppercase">{z.name}</div>
              </button>
            ))}
          </div>

          <div className="border border-zinc-800 p-4 mb-6">
            <div className="text-xs text-zinc-500 mb-2 tracking-widest">PARTY</div>
            {party.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <span>{p.name}</span>
                <span className="text-zinc-400">
                  {p.hp}/{p.maxHp} HP
                </span>
              </div>
            ))}
          </div>

          <div className="text-xs text-zinc-600 space-y-1">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "combat") {
    return (
      <div className="min-h-screen bg-black text-white p-6 relative">
        <div className="max-w-2xl mx-auto mt-10">
          <h2 className="text-2xl font-black tracking-tighter mb-6 text-red-500">COMBAT</h2>

          <div className="mb-8 space-y-3">
            {enemies.map((e) => (
              <div key={e.id} className="border border-zinc-800 p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{e.name}</span>
                  <span>
                    {e.hp}/{e.maxHp}
                  </span>
                </div>
                <div className="h-1 bg-zinc-900">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${(e.hp / e.maxHp) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8 space-y-2">
            {party.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveHero(i)}
                className={`w-full text-left border p-3 transition-all ${
                  i === activeHero ? "border-red-600 bg-red-950/10" : "border-zinc-800"
                }`}
              >
                <div className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span>
                    {p.hp}/{p.maxHp}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={attack}
              className="border border-zinc-700 py-3 text-xs tracking-widest uppercase hover:border-red-600"
            >
              Attack
            </button>
            <button
              onClick={useSpecial}
              className="border border-zinc-700 py-3 text-xs tracking-widest uppercase hover:border-red-600"
            >
              Special
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {inventory.map((item) => (
              <button
                key={item.id}
                onClick={() => useItem(item)}
                className="text-xs border border-zinc-700 px-3 py-2 hover:border-red-600"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-500 space-y-1 h-24 overflow-hidden">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Game end
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">
      <button
        onClick={exitGame}
        className="absolute top-6 left-6 text-xs tracking-widest uppercase hover:text-red-500"
      >
        ← Back to Session
      </button>
      <h2 className="text-4xl font-black tracking-tighter mb-4">SESSION OVER</h2>
      <p className="text-zinc-500 text-sm mb-10 tracking-widest">Night continues...</p>
      <button
        onClick={startGame}
        className="px-8 py-3 border border-white/30 text-xs tracking-[0.25em] uppercase hover:border-red-600 hover:text-red-500"
      >
        Run It Back
      </button>
    </div>
  );
}