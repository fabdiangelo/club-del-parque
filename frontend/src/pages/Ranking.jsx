// src/pages/Rankings.jsx
import React, { useEffect, useMemo, useState } from "react";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { Crown, Search, X } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";
import { useAuth } from "../contexts/AuthProvider.jsx";
import { Link } from "react-router-dom";

const NAVBAR_OFFSET_REM = 5;

// UI labels
const SPORTS = ["Tenis", "Padel"];
const CATEGORIES = ["Singles", "Dobles"];
const GENDERS_SINGLES = ["Masculino", "Femenino"];
const GENDERS_DOUBLES = ["Masculino", "Femenino", "Mixto"];

/* ------------------------- Helpers ------------------------- */
const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);
const fetchJSON = async (path, opts = {}) => {
  const res = await fetch(toApi(path), {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    cache: "no-store",
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
};
const normalizeError = (e) => {
  try {
    const str = String(e?.message || e);
    const i = str.indexOf("{");
    if (i >= 0) {
      const json = JSON.parse(str.slice(i));
      return json?.mensaje || json?.error || str;
    }
    return str;
  } catch {
    return String(e?.message || e);
  }
};

const normalizeStr = (s = "") =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const uiSportToApi = (label = "") => {
  const s = normalizeStr(label);
  if (s.includes("padel")) return "padel";
  return "tenis";
};

const seasonNameOf = (t) => {
  if (!t) return "";
  if (t.nombre && String(t.nombre).trim()) return String(t.nombre).trim();
  if (typeof t.anio !== "undefined" && t.anio !== null) return String(t.anio);
  const ini = t.fechaInicio || t.inicio || "";
  const fin = t.fechaFin || t.fin || "";
  const compact = [ini, fin].filter(Boolean).join(" → ");
  return compact || "Temporada";
};
const seasonStartISO = (t) =>
  (t?.fechaInicio || t?.inicio || "")?.slice(0, 10) || "";

// Robust tipo parser (detects "dobles" and variants)
const parseTipo = (tipoRaw = "") => {
  const t = normalizeStr(String(tipoRaw)).trim();

  let category = null;
  if (t.includes("singles") || t.includes("single")) category = "Singles";
  if (t.includes("dobles") || t.includes("doble") || t.includes("double") || t.includes("doubles")) {
    category = "Dobles";
  }

  // If gender is encoded in tipo, detect it; else fallback by category
  let gender = null;
  if (t.includes("mixed") || t.includes("mixto")) gender = "Mixto";
  else if (t.includes("fem")) gender = "Femenino";
  else if (category === "Singles") gender = "Masculino";
  else if (category === "Dobles") gender = "Masculino";

  return { category, gender };
};

// Backend expects only 'singles' | 'dobles'
const buildTipoFromUI = (category /*, gender*/) =>
  category === "Singles" ? "singles" : "dobles";

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

/* ------------------------- Gender helpers (from federados) ------------------------- */
const normalizeGender = (g) => {
  const v = normalizeStr(g || "");
  if (["m", "masc", "masculino", "male", "hombre"].some((x) => v.includes(x))) return "Masculino";
  if (["f", "fem", "femenino", "female", "mujer"].some((x) => v.includes(x))) return "Femenino";
  return "unknown";
};

function makeFederadoMaps(federados = []) {
  const byId = new Map();
  const genderById = new Map();
  federados.forEach((u, i) => {
    const id = u.id || u.uid || String(i);
    const name =
      [u.nombre, u.apellido].filter(Boolean).join(" ") ||
      u.nombre ||
      u.email ||
      "Jugador";
    byId.set(u.id || u.uid || u.email || id, name);
    byId.set(id, name);
    const g = normalizeGender(u.genero ?? u.sexo);
    genderById.set(u.id || id, g);
  });
  return { nameById: byId, genderById };
}

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
  const [gender, setGender] = useState(GENDERS_SINGLES[0]);
  const [season, setSeason] = useState(""); // display name
  const [query, setQuery] = useState("");

  // Data
  const [temporadas, setTemporadas] = useState([]);      // all seasons
  const [federados, setFederados] = useState([]);        // players
  const [rankingsRaw, setRankingsRaw] = useState([]);    // filtered fetch result
  const [rankingsAllForSport, setRankingsAllForSport] = useState([]); // for availability/season list
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Singles can't be Mixto
  useEffect(() => {
    if (category === "Singles" && gender === "Mixto") setGender(GENDERS_SINGLES[0]);
  }, [category, gender]);

  // When sport changes, reset sensible defaults
  useEffect(() => {
    setCategory("Singles");
    setGender(GENDERS_SINGLES[0]);
  }, [sport]);

  // Base load
  useEffect(() => {
    let cancelled = false;
    async function loadBase() {
      setLoading(true);
      setErr("");
      try {
        const [ts, fs] = await Promise.all([
          fetchJSON("/temporadas"),
          fetchJSON("/usuarios/federados"),
        ]);

        const normalizedTemps = (ts || []).map((t) => ({
          ...t,
          _name: seasonNameOf(t),
          _startISO: seasonStartISO(t),
        }));

        let rkGlobal = [];
        try {
          rkGlobal = await fetchJSON("/rankings?leaderboard=true");
        } catch {
          rkGlobal = [];
        }

        if (!cancelled) {
          setTemporadas(normalizedTemps);
          setFederados(Array.isArray(fs) ? fs : []);

          // defaults
          const rankedTempIDs = new Set((rkGlobal || []).map((x) => x.temporadaID).filter(Boolean));
          const seasonsWithRank = normalizedTemps.filter((t) => rankedTempIDs.has(t.id));
          const activa = seasonsWithRank.find((t) => t.estado === "activa");
          const sorted = (seasonsWithRank.length ? seasonsWithRank : normalizedTemps).sort((a, b) =>
            String(b._startISO).localeCompare(String(a._startISO))
          );
          const defaultSeason = (activa?._name || sorted[0]?._name || "");
          if (!season) setSeason(defaultSeason);

          const tipos = new Set((rkGlobal || []).map((x) => x.tipoDePartido).filter(Boolean));
          const firstTipo = [...tipos][0] || "";
          const parsed = parseTipo(firstTipo);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.gender) setGender(parsed.gender);

          const deportes = new Set((rkGlobal || []).map((x) => (x.deporte || "").toLowerCase()).filter(Boolean));
          if (deportes.has("padel")) setSport("Padel");
          else if (deportes.has("tenis")) setSport("Tenis");
        }
      } catch (e) {
        if (!cancelled) setErr(normalizeError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBase();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch ALL rankings for selected sport (no temporada filter)
  useEffect(() => {
    let cancelled = false;
    async function loadAllSeasonsForSport() {
      const deporte = uiSportToApi(sport);
      try {
        const params = new URLSearchParams({ leaderboard: "true", deporte });
        const rk = await fetchJSON(`/rankings?${params.toString()}`);
        if (!cancelled) setRankingsAllForSport(Array.isArray(rk) ? rk : []);
      } catch {
        if (!cancelled) setRankingsAllForSport([]);
      }
    }
    loadAllSeasonsForSport();
    return () => {
      cancelled = true;
    };
  }, [sport]);

  // Fetch rankings for (temporada, tipo, deporte)
  useEffect(() => {
    let cancelled = false;
    async function loadRankingsForFilters() {
      const t = temporadas.find((tt) => tt._name === season);
      const temporadaID = t?.id;
      if (!temporadaID) return;

      const tipoDePartido = buildTipoFromUI(category, gender);
      const deporte = uiSportToApi(sport);

      setLoading(true);
      setErr("");
      try {
        const params = new URLSearchParams({
          temporadaID,
          tipoDePartido,
          deporte,
          leaderboard: "true",
        });
        const rk = await fetchJSON(`/rankings?${params.toString()}`);
        if (!cancelled) setRankingsRaw(Array.isArray(rk) ? rk : []);
      } catch (e) {
        if (!cancelled) setErr(normalizeError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (temporadas.length > 0 && season) loadRankingsForFilters();
    return () => {
      cancelled = true;
    };
  }, [temporadas, season, category, gender, sport]);

  /* ------------------------- Maps from federados ------------------------- */
  const { nameById, genderById } = useMemo(
    () => makeFederadoMaps(federados),
    [federados]
  );

  /* ------------------------- Season options ------------------------- */
  const seasonOptions = useMemo(() => {
    const targetDeporte = uiSportToApi(sport);
    const rankedIdsForSport = new Set(
      (rankingsAllForSport || [])
        .filter((x) => (x.deporte || "").toLowerCase() === targetDeporte)
        .map((x) => x.temporadaID)
        .filter(Boolean)
    );
    const list = temporadas.filter((t) =>
      rankedIdsForSport.size ? rankedIdsForSport.has(t.id) : true
    );
    const sorted = [...list].sort((a, b) =>
      String(b._startISO).localeCompare(String(a._startISO))
    );
    return sorted.map((t) => t._name);
  }, [rankingsAllForSport, temporadas, sport]);

  /* ------------------------- Availability (uses federados' gender) ------------------------- */
  const tipoAvailability = useMemo(() => {
    const selectedSeason = temporadas.find((tt) => tt._name === season);
    const temporadaID = selectedSeason?.id;
    const targetDeporte = uiSportToApi(sport);

    // Universe: all ranking rows for this sport (+ temporada if chosen)
    const universe = (rankingsAllForSport || [])
      .filter((rk) => (rk.deporte || "").toLowerCase() === targetDeporte)
      .filter((rk) => (!temporadaID || rk.temporadaID === temporadaID));

    // Which tipos exist at all
    const tipos = new Set(universe.map((rk) => rk.tipoDePartido).filter(Boolean));
    const parsed = [...tipos].map(parseTipo);
    const hasSingles = parsed.some((p) => p.category === "Singles");
    const hasDobles  = parsed.some((p) => p.category === "Dobles");

    // Gender availability based on federados:
    // For Singles: enable Masculino/Femenino if there are ranked players with that gender
    // For Dobles: Masculino if any men, Femenino if any women, Mixto if both genders exist
    const singlesRows = universe.filter((rk) => {
      const p = parseTipo(rk.tipoDePartido);
      return p.category === "Singles";
    });
    const doublesRows = universe.filter((rk) => {
      const p = parseTipo(rk.tipoDePartido);
      return p.category === "Dobles";
    });

    const hasMaleSingles   = singlesRows.some((rk) => genderById.get(rk.usuarioID) === "Masculino");
    const hasFemaleSingles = singlesRows.some((rk) => genderById.get(rk.usuarioID) === "Femenino");

    const hasMaleDoubles   = doublesRows.some((rk) => genderById.get(rk.usuarioID) === "Masculino");
    const hasFemaleDoubles = doublesRows.some((rk) => genderById.get(rk.usuarioID) === "Femenino");

    const gendersSingles = new Set([
      ...(hasMaleSingles ? ["Masculino"] : []),
      ...(hasFemaleSingles ? ["Femenino"] : []),
    ]);

    const gendersDobles = new Set([
      ...(hasMaleDoubles ? ["Masculino"] : []),
      ...(hasFemaleDoubles ? ["Femenino"] : []),
      ...((hasMaleDoubles && hasFemaleDoubles) ? ["Mixto"] : []),
    ]);

    return { hasSingles, hasDobles, gendersSingles, gendersDobles };
  }, [rankingsAllForSport, temporadas, season, sport, genderById]);

  // Adjust category if current one is unavailable
  useEffect(() => {
    if (category === "Singles" && !tipoAvailability.hasSingles && tipoAvailability.hasDobles) {
      setCategory("Dobles");
    } else if (category === "Dobles" && !tipoAvailability.hasDobles && tipoAvailability.hasSingles) {
      setCategory("Singles");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoAvailability]);

  // Snap gender to first allowed if needed
  useEffect(() => {
    const allowed =
      category === "Singles"
        ? Array.from(tipoAvailability.gendersSingles || [])
        : Array.from(tipoAvailability.gendersDobles || []);
    if (allowed.length && !allowed.includes(gender)) setGender(allowed[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, tipoAvailability]);

  /* ------------------------- Rows (filter by deporte, temporada, tipo, and GENERO) ------------------------- */
  const filteredRows = useMemo(() => {
    const t = temporadas.find((tt) => tt._name === season);
    const temporadaID = t?.id;
    const targetTipo = buildTipoFromUI(category, gender);
    const targetDeporte = uiSportToApi(sport);

    // Base filters: temporada + deporte + tipo (category match)
    let rows = (rankingsRaw || [])
      .filter(
        (rk) =>
          (!temporadaID || rk.temporadaID === temporadaID) &&
          (rk.deporte || "").toLowerCase() === targetDeporte
      )
      .filter((rk) => {
        const pA = parseTipo(rk.tipoDePartido);
        const pB = parseTipo(targetTipo);
        return pA.category === pB.category; // compare category only here
      });

    // Apply GENDER from federados:
    // Singles: include only the chosen gender
    // Dobles: if Mixto -> include both genders; else only the chosen one
    if (category === "Singles") {
      rows = rows.filter((rk) => genderById.get(rk.usuarioID) === gender);
    } else {
      if (gender === "Masculino" || gender === "Femenino") {
        rows = rows.filter((rk) => genderById.get(rk.usuarioID) === gender);
      } else {
        // Mixto: keep both M and F; drop unknowns
        rows = rows.filter((rk) => {
          const g = genderById.get(rk.usuarioID);
          return g === "Masculino" || g === "Femenino";
        });
      }
    }

    // Map to UI
    rows = rows
      .filter((rk) => Number.isFinite(Number(rk.puntos)))
      .map((rk) => ({
        id: rk.id,
        name: nameById.get(rk.usuarioID) || rk.usuarioID,
        wins: Number(rk.partidosGanados ?? 0),
        losses: Number(rk.partidosPerdidos ?? 0),
        points: Number(rk.puntos) || 0,
      }));

    // Search
    if (query) {
      const q = normalizeStr(query);
      rows = rows.filter((r) => normalizeStr(r.name).includes(q));
    }

    // Sort
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [rankingsRaw, temporadas, season, category, gender, sport, query, nameById, genderById]);

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
        <NavbarBlanco />

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
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">▾</span>
              </div>

              {/* Season */}
              <div className="relative">
                <select
                  id="season"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  aria-label="Temporada"
                >
                  {seasonOptions.length === 0 ? (
                    <option value="">Sin temporadas con ranking</option>
                  ) : (
                    seasonOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">▾</span>
              </div>

              {/* Category */}
              <div className="flex flex-row flex-wrap items-center gap-3">
                {CATEGORIES.map((c) => {
                  const isAvailable =
                    (c === "Singles" && tipoAvailability.hasSingles) ||
                    (c === "Dobles" && tipoAvailability.hasDobles);
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => isAvailable && setCategory(c)}
                      className={`h-12 px-6 text-lg rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 active:scale-[.98] shadow-sm ${
                        active
                          ? "bg-cyan-700/90 text-white border-white"
                          : "bg-neutral-900/80 text-white border-white/40 hover:bg-neutral-800/80"
                      } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                      aria-pressed={active}
                      disabled={!isAvailable}
                      title={!isAvailable ? "No hay rankings para esta categoría en la temporada seleccionada" : undefined}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              {/* Gender */}
              <div className="flex flex-row flex-wrap items-center gap-2 ml-2">
                {(category === "Singles" ? GENDERS_SINGLES : GENDERS_DOUBLES).map((g) => {
                  const allowedSet =
                    category === "Singles" ? tipoAvailability.gendersSingles : tipoAvailability.gendersDobles;
                  const isAvailable = allowedSet?.has(g);
                  const active = gender === g;
                  return (
                    <button
                      key={g}
                      onClick={() => isAvailable && setGender(g)}
                      className={`h-10 px-4 text-base rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 active:scale-[.98] shadow-sm ${
                        active
                          ? "bg-cyan-600/90 text-white border-white"
                          : "bg-neutral-900/80 text-white border-white/40 hover:bg-neutral-800/80"
                      } ${!isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                      aria-pressed={active}
                      disabled={!isAvailable}
                      title={!isAvailable ? "No hay rankings para este género en la temporada/categoría seleccionada" : undefined}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full max-w-sm ml-2">
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
                          {rankingsRaw.length === 0 ? "No hay rankings cargados." : `Sin resultados para "${query}".`}
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
                        <td className="px-6 py-4 border-t border-white/10">{Number.isFinite(r.wins) ? r.wins : "—"}</td>
                        <td className="px-6 py-4 border-t border-white/10">{Number.isFinite(r.losses) ? r.losses : "—"}</td>
                        <td className="px-6 py-4 border-t border-white/10 font-semibold">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 text-xs text-white/60 border-t border-white/10">
                Nota: el filtro de género usa el <em>genero/sexo</em> del jugador en "Federados".
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
