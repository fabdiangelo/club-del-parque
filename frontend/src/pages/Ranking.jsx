// src/pages/Rankings.jsx
import React, { useEffect, useMemo, useState } from "react";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { Crown, Search, X } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";
import { useAuth } from "../contexts/AuthProvider.jsx";
import { Link } from "react-router-dom";

const NAVBAR_OFFSET_REM = 5;

// UI options (kept for future filtering)
const SPORTS = ["Tenis", "Padel"];
const CATEGORIES = ["Singles", "Dobles"];
const GENDERS_SINGLES = ["Masculino", "Femenino"];
const GENDERS_DOUBLES = ["Masculino", "Femenino", "Mixto"];

// Helpers
const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);
const normalizeStr = (s = "") =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const seasonNameOf = (t) => {
  if (!t) return "";
  // Prefer nombre → anio → fechaInicio/fechaFin fallback
  if (t.nombre && String(t.nombre).trim()) return String(t.nombre).trim();
  if (typeof t.anio !== "undefined" && t.anio !== null) return String(t.anio);
  const ini = t.fechaInicio || t.inicio || "";
  const fin = t.fechaFin || t.fin || "";
  const compact = [ini, fin].filter(Boolean).join(" → ");
  return compact || "Temporada";
};

const seasonStartISO = (t) =>
  (t?.fechaInicio || t?.inicio || "")?.slice(0, 10) || "";

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
  const {user} = useAuth();

  // UI state
  const [sport, setSport] = useState(SPORTS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [gender, setGender] = useState(GENDERS_SINGLES[0]); // default for Singles
  const [season, setSeason] = useState(""); // display name from backend temporadas
  const [query, setQuery] = useState("");

  // Data
  const [temporadas, setTemporadas] = useState([]); // normalized with ._name
  const [players, setPlayers] = useState([]); // federados
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Prevent Singles=Mixto
  useEffect(() => {
    if (category === "Singles" && gender === "Mixto") {
      setGender(GENDERS_SINGLES[0]);
    }
  }, [category, gender]);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setErr("");
      try {
        // Fetch temporadas
        const rTmp = await fetch(toApi("/temporadas"), { cache: "no-store" });
        if (!rTmp.ok) throw new Error(`Temporadas HTTP ${rTmp.status}`);
        const tmp = await rTmp.json();
        if (!Array.isArray(tmp)) throw new Error("Temporadas inválidas");

        // Normalize temporadas to include a display name
        const normalizedTemps = tmp.map((t) => ({
          ...t,
          _name: seasonNameOf(t),
          _startISO: seasonStartISO(t),
        }));

        // Pick activa or latest by start date desc (fallback)
        const activa = normalizedTemps.find((t) => t.estado === "activa");
        const sortedTemps = [...normalizedTemps].sort((a, b) => {
          // If both have numeric year, sort by year desc
          const aYear = typeof a.anio === "number" ? a.anio : parseInt(a.anio, 10);
          const bYear = typeof b.anio === "number" ? b.anio : parseInt(b.anio, 10);
          if (!Number.isNaN(aYear) && !Number.isNaN(bYear)) return bYear - aYear;

          // Else by start ISO desc
          return String(b._startISO).localeCompare(String(a._startISO));
        });

        const defaultSeasonName =
          activa?._name || sortedTemps[0]?._name || "";

        // Fetch federados
        const rFed = await fetch(toApi("/usuarios/federados"), {
          cache: "no-store",
        });
        if (!rFed.ok) throw new Error(`Federados HTTP ${rFed.status}`);
        const fed = await rFed.json();
        if (!Array.isArray(fed)) throw new Error("Federados inválidos");

        if (!cancelled) {
          setTemporadas(sortedTemps);
          if (!season) setSeason(String(defaultSeasonName));
          const normalizedPlayers = fed.map((u, i) => ({
            id: u.id || u.uid || String(i),
            name:
              [u.nombre, u.apellido].filter(Boolean).join(" ") ||
              u.nombre ||
              u.email ||
              "Jugador",
            genero: u.genero || u.sexo || null,
            wins:
              Number.isFinite(u.partidosGanados) && u.partidosGanados >= 0
                ? u.partidosGanados
                : 0,
            losses:
              Number.isFinite(u.partidosPerdidos) && u.partidosPerdidos >= 0
                ? u.partidosPerdidos
                : 0,
            points: Number.isFinite(u.puntos) ? u.puntos : 0,
          }));
          setPlayers(normalizedPlayers);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Error cargando datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Options = display names
  const seasonOptions = useMemo(
    () => temporadas.map((t) => t._name).filter(Boolean),
    [temporadas]
  );

  // Filter + sort rows; assign rank 1..N
  const filteredRows = useMemo(() => {
    let rows = players;

    if (query) {
      const q = normalizeStr(query);
      rows = rows.filter((r) => normalizeStr(r.name).includes(q));
    }

    rows = [...rows].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [players, query]);

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

  const genderOptions =
    category === "Singles" ? GENDERS_SINGLES : GENDERS_DOUBLES;

  useEffect(() => {
    if (!genderOptions.includes(gender)) {
      setGender(genderOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

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
        <NavbarBlanco />

        {/* Header */}
        <header className="w-full">
          <div
            className="mx-auto max-w-7xl px-6 lg:px-8 text-center"
            style={{
              paddingTop: `${NAVBAR_OFFSET_REM}rem`,
              paddingBottom: "1.25rem",
            }}
          >
            <h1
              className="text-6xl sm:text-7xl font-extrabold tracking-tight drop-shadow-xl"
              style={strokeTitle}
            >
              <AnimatedTitle text="Ranking" />
            </h1>

            {/* Controls */}
            <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
              {/* Sport */}
              <label className="sr-only" htmlFor="sport">
                Deporte
              </label>
              <div className="relative">
                <select
                  id="sport"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  aria-label="Deporte"
                >
                  {SPORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                  ▾
                </span>
              </div>

              {/* Season (uses normalized names) */}
              <label className="sr-only" htmlFor="season">
                Temporada
              </label>
              <div className="relative">
                <select
                  id="season"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  aria-label="Temporada"
                >
                  {seasonOptions.length === 0 ? (
                    <option value="">Sin temporadas</option>
                  ) : (
                    seasonOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                  ▾
                </span>
              </div>

              {/* Category */}
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

              {/* Gender chooser (visual for now) */}
              <div className="flex flex-row flex-wrap items-center gap-2 ml-2">
                {genderOptions.map((g) => {
                  const active = gender === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`h-10 px-4 text-base rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 active:scale-[.98] shadow-sm ${
                        active
                          ? "bg-cyan-600/90 text-white border-white"
                          : "bg-neutral-900/80 text-white border-white/40 hover:bg-neutral-800/80"
                      }`}
                      aria-pressed={active}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full max-w-sm ml-2">
                <label className="sr-only" htmlFor="player-search">
                  Buscar jugador
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
                  aria-hidden
                />
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
              {user?.rol == "administrador" && (
            <Link to="/temporadas" className="btn btn-primary mt-4">
              Crear Temporadas
            </Link>
          )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20">
            <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <h2 className="text-xl sm:text-2xl font-bold" style={strokeSmall}>
                  {sport} · {category} · {gender}
                  {season ? ` · Temporada ${season}` : ""}
                </h2>
              </div>

              {(loading || err) && (
                <div className="px-6 pt-2 pb-3 text-sm text-white/80">
                  {loading ? "Cargando datos…" : `Error: ${err}`}
                </div>
              )}

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
                    {!loading && filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center border-t border-white/10 text-white/70">
                          {players.length === 0
                            ? "No hay jugadores federados disponibles."
                            : `Sin resultados para "${query}".`}
                        </td>
                      </tr>
                    )}

                    {filteredRows.map((r, i) => (
                      <tr
                        key={r.id}
                        className={`transition-colors hover:bg-neutral-800/60 ${
                          i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
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

              <div className="px-6 py-3 text-xs text-white/60 border-t border-white/10">
                Nota: los jugadores sin partidos aún aparecen con <strong>0 puntos</strong>. Las
                posiciones se calculan por puntos, luego victorias, y alfabético.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
