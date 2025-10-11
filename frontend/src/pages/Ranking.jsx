import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Crown, Search, X } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";

const NAVBAR_OFFSET_REM = 5;

const PLACEHOLDER_ROWS = [
  { rank: 1, name: "Ana Pereira", wins: 12, losses: 2, points: 1240 },
  { rank: 2, name: "Marcos Gómez", wins: 10, losses: 4, points: 1100 },
  { rank: 3, name: "Lucía Rodríguez", wins: 8, losses: 5, points: 980 },
  { rank: 4, name: "Diego Fernández", wins: 7, losses: 6, points: 910 },
  { rank: 5, name: "Sofía Cabrera", wins: 6, losses: 7, points: 860 },
  { rank: 6, name: "Julián Viera", wins: 6, losses: 8, points: 820 },
  { rank: 7, name: "Valentina López", wins: 5, losses: 9, points: 790 },
  { rank: 8, name: "Tomás Silva", wins: 4, losses: 10, points: 760 },
];

// 🔹 Placeholders for future DB data
const SPORTS = ["Tenis", "Padel"];
const CATEGORIES = ["Singles", "Doubles", "Mixto"];
const SEASONS = ["2025", "2024", "2023"];

// Accent-insensitive normalizer and highlighter for player names
const normalizeStr = (s = "") => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const renderHighlightedName = (name, q) => {
  if (!q) return name;
  const nName = normalizeStr(name);
  const nQ = normalizeStr(q);
  const idx = nName.indexOf(nQ);
  if (idx === -1) return name;
  const before = name.slice(0, idx);
  const match = name.slice(idx, idx + q.length);
  const after = name.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="bg-yellow-300/30 rounded px-0.5">{match}</mark>
      {after}
    </>
  );
};

function AnimatedTitle({ text, className, style }) {
  return (
    <>
      <style>{`
        @keyframes subtleGlow {
          0%, 30%, 50% { color: #ffffff; text-shadow: none; }
          20% {
            color: #fef9c3;
            text-shadow: 0 0 6px rgba(255,239,184,.7), 0 0 12px rgba(255,239,184,.45);
          }
        }
        .glow-letter:hover { animation-play-state: paused; }
      `}</style>

      <span className={className} style={style}>
        {text.split("").map((ch, i) => (
          <span
            key={i}
            className="glow-letter inline-block"
            style={{
              animation: "subtleGlow 18s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </>
  );
}

export default function Rankings() {
  const [sport, setSport] = useState(SPORTS[0]); // default Tenis
  const [category, setCategory] = useState(CATEGORIES[0]); // default Singles
  const [season, setSeason] = useState(SEASONS[0]); // default 2025
  const rows = useMemo(() => PLACEHOLDER_ROWS, []);
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    if (!query) return rows;
    const q = normalizeStr(query);
    return rows.filter((r) => normalizeStr(r.name).includes(q));
  }, [rows, query]);

  const strokeTitle = {
    color: "#ffffffff",
    WebkitTextStroke: "1.4px rgba(16,16,16,1)",
    textShadow: "0 0 20px #000, 0 0 1px #000, 0 0 1px #000, 0 0 1px #000",
  };

  const strokeSmall = {
    color: "#ffffffff",
    WebkitTextStroke: "0.25px #000000ff",
    textShadow: "0 0 5px #000, 0 0 .5px #000, 0 0 .5px #000",
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        {/* Header */}
        <header className="w-full">
          <div
            className="mx-auto max-w-7xl px-6 lg:px-8 text-center"
            style={{ paddingTop: `${NAVBAR_OFFSET_REM}rem`, paddingBottom: "1.25rem" }}
          >
            <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight drop-shadow-xl" style={strokeTitle}>
              <AnimatedTitle text="Ranking" />
            </h1>

            {/* Controls */}
            <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
              {/* Sport */}
              <label className="sr-only" htmlFor="sport">Deporte</label>
              <div className="relative">
                <select
                  id="sport"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  aria-label="Deporte"
                >
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">▾</span>
              </div>

              {/* Season */}
              <label className="sr-only" htmlFor="season">Temporada</label>
              <div className="relative">
                <select
                  id="season"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  aria-label="Temporada"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>Temporada {s}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">▾</span>
              </div>

              {/* Category Buttons (inline) */}
              <div className="flex flex-row flex-wrap items-center gap-3">
                {CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`h-12 px-6 text-lg rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 active:scale-[.98] shadow-sm ${
                        active
                          ? "bg-cyan-700/90 text-white border-white"
                          : "bg-neutral-900/80 text-white border-white/40 hover:bg-neutral-800/80"
                      }`}
                      aria-pressed={active}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20">
            <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <h2 className="text-xl sm:text-2xl font-bold" style={strokeSmall}>
                  {sport} · {category} · Temporada {season}
                </h2>
                {/* Player Finder (top-right) */}
                <div className="relative w-full max-w-sm">
                  <label className="sr-only" htmlFor="player-search">Buscar jugador</label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden />
                  <input
                    id="player-search"
                    type="text"
                    inputMode="search"
                    placeholder="Buscar jugador por nombre"
                    className="w-full h-11 rounded-lg border border-white/30 bg-neutral-900/80 text-white pl-9 pr-10 text-base placeholder-white/50 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
                      onClick={() => setQuery("")}
                    >
                      <X className="w-5 h-5 text-white/70" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="bg-neutral-800/80 text-base sm:text-lg">
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Posición</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Jugador</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">PG</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">PP</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Puntos</th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center border-t border-white/10 text-white/70">
                          Sin resultados para "{query}".
                        </td>
                      </tr>
                    )}
                    {filteredRows.map((r) => (
                      <tr
                        key={r.rank}
                        className={`transition-colors hover:bg-neutral-800/60 ${
                          r.rank % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                        }`}
                      >
                        <td className="px-6 py-4 border-t border-white/10 font-extrabold">{r.rank}</td>
                        <td className="px-6 py-4 border-t border-white/10">
                          <div className="flex items-center gap-3">
                            <span className="truncate">{renderHighlightedName(r.name, query)}</span>
                            {r.rank === 1 && (
                              <Crown
                                className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,255,0,0.75)]"
                                aria-hidden="true"
                                fill="currentColor"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-t border-white/10">{r.wins}</td>
                        <td className="px-6 py-4 border-t border-white/10">{r.losses}</td>
                        <td className="px-6 py-4 border-t border-white/10 font-semibold">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
