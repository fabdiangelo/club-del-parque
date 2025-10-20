import React, { useEffect, useMemo, useState } from "react";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { Crown, Search, X } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";
import { useAuth } from "../contexts/AuthProvider.jsx";
import { Link } from "react-router-dom";

const NAVBAR_OFFSET_REM = 5;

const ROW_PX = 56;
const THEAD_PX = 56;
const RAIL_W = 84;
const CARD_TOPBAR_PX = 56;
const RAIL_OUTSIDE_PX = RAIL_W;

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

const titleCase = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());

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

const parseTipo = (tipoRaw = "") => {
  const t = normalizeStr(String(tipoRaw)).trim();
  let category = null;
  if (t.includes("singles") || t.includes("single")) category = "Singles";
  if (
    t.includes("dobles") ||
    t.includes("doble") ||
    t.includes("double") ||
    t.includes("doubles")
  )
    category = "Dobles";
  let gender = null;
  if (t.includes("mixed") || t.includes("mixto")) gender = "Mixto";
  else if (t.includes("fem")) gender = "Femenino";
  else if (category === "Singles") gender = "Masculino";
  else if (category === "Dobles") gender = "Masculino";
  return { category, gender };
};

// UI <-> API modalidad bridge
const uiModalidad = (m) => (String(m).toLowerCase() === "doble" ? "Dobles" : "Singles");
const apiModalidad = (ui) => (ui === "Dobles" ? "doble" : "single");

// The API expects tipoDePartido = "singles" | "dobles"
const buildTipoFromUI = (category) => (category === "Singles" ? "singles" : "dobles");

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

const normalizeGender = (g = "") => {
  const first = (String(g).trim()[0] || "").toLowerCase();
  if (first === "m") return "Masculino";
  if (first === "f") return "Femenino";
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

/* ------------------------- Categorías helpers ------------------------- */
const catIdOf = (rk) =>
  rk.categoriaID ?? rk.categoriaId ?? rk.categoria?.id ?? null;
const catIdByNombre = (rk, allCats) => {
  const nom =
    rk.categoriaNombre ??
    rk.categoriaNombreUI ??
    rk.categoria ??
    rk.categoriaLabel ??
    "";
  const n = normalizeStr(nom);
  if (!n) return null;
  const hit = (allCats || []).find((c) => normalizeStr(c.nombre) === n);
  return hit?.id ?? null;
};

export default function Rankings() {
  const {user} = useAuth();
  // Dynamic lists from DB
  const [deportes, setDeportes] = useState([]);       // [{id, nombre}]
  const [modalidades, setModalidades] = useState([]); // [{nombre}]
  const [generos, setGeneros] = useState([]);         // [{nombre}]
  const [filtros, setFiltros] = useState([]);         // [{id, modalidad:{nombre}, genero:{nombre}, ...}]

  // UI options derived from DB
  const [sportOptions, setSportOptions] = useState([]);      // ["Tenis", ...]
  const [categoryOptions, setCategoryOptions] = useState([]); // ["Singles","Dobles"]
  const [genderOptions, setGenderOptions] = useState([]);     // ["Masculino","Femenino","Mixto"]

  // UI state
  const [sport, setSport] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [season, setSeason] = useState("");
  const [query, setQuery] = useState("");

  // Data
  const [temporadas, setTemporadas] = useState([]);
  const [federados, setFederados] = useState([]);
  const [rankingsRaw, setRankingsRaw] = useState([]);
  const [rankingsAllForSport, setRankingsAllForSport] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Singles can't be Mixto (we’ll also constrain via genderOptions)
  useEffect(() => {
    if (category === "Singles" && gender === "Mixto") {
      const firstAllowed = genderOptions.find((g) => g !== "Mixto");
      if (firstAllowed) setGender(firstAllowed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Reset defaults on sport change (but from dynamic options)
  useEffect(() => {
    if (categoryOptions.length && !category) setCategory(categoryOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, categoryOptions.length]);

  // -------------------- Load base + dictionaries (from DB) --------------------
  useEffect(() => {
    let cancelled = false;

    async function loadDictionaries() {
      try {
        const [deps, mods, gens, filts] = await Promise.all([
          fetchJSON("/deportes"),
          fetchJSON("/modalidades"),
          fetchJSON("/generos"),
          fetchJSON("/filtros"),
        ]);

        if (cancelled) return;

        const depsNorm = Array.isArray(deps)
          ? deps.map((d) => ({
              id: String(d.id || "").toLowerCase(),
              nombre: titleCase(d.nombre || d.id || ""),
            }))
          : [];
        setDeportes(depsNorm);
        setSportOptions(depsNorm.map((d) => d.nombre));

        const modsNorm = Array.isArray(mods)
          ? mods
              .map((m) => String(m?.nombre || "").toLowerCase())
              .filter(Boolean)
          : [];
        setModalidades(modsNorm.map((m) => ({ nombre: m })));

        const gensNorm = Array.isArray(gens)
          ? gens
              .map((g) => String(g?.nombre || "").toLowerCase())
              .filter(Boolean)
          : [];
        setGeneros(gensNorm.map((g) => ({ nombre: g })));

        const filtsNorm = Array.isArray(filts)
          ? filts.map((f) => ({
              ...f,
              modalidad: { nombre: String(f?.modalidad?.nombre || "").toLowerCase() },
              genero: { nombre: String(f?.genero?.nombre || "").toLowerCase() },
            }))
          : [];
        setFiltros(filtsNorm);

        // Build category options from filtros/modalidades present
        const catSet = new Set(
          filtsNorm
            .map((f) => uiModalidad(f?.modalidad?.nombre))
            .filter(Boolean)
        );
        if (catSet.size === 0) {
          // fallback to modalidades if no filtros yet
          modalidades.forEach((m) => catSet.add(uiModalidad(m.nombre)));
        }
        const cats = Array.from(catSet);
        setCategoryOptions(cats.length ? cats : ["Singles", "Dobles"]);

        // Default sport from DB (titleCase) if present
        if (!sport && depsNorm.length) setSport(depsNorm[0].nombre);

        // Default category from options
        if (!category && cats.length) setCategory(cats[0]);

        // Default gender from filtros for the first category
        const firstCatApi = apiModalidad(cats[0] || "Singles");
        const gSet = new Set(
          filtsNorm
            .filter((f) => f?.modalidad?.nombre === firstCatApi)
            .map((f) => f?.genero?.nombre)
            .filter(Boolean)
            .map((g) => titleCase(g))
        );
        const gOpts = Array.from(gSet);
        setGenderOptions(gOpts.length ? gOpts : ["Masculino", "Femenino"]);
        if (!gender && gOpts.length) setGender(gOpts[0]);
      } catch (e) {
        if (!cancelled) setErr(normalizeError(e));
      }
    }

    async function loadBase() {
      setLoading(true);
      setErr("");
      try {
        const [ts, fs, cats, rkGlobalRaw] = await Promise.all([
          fetchJSON("/temporadas"),
          fetchJSON("/usuarios/federados"),
          fetchJSON("/categorias"),
          (async () => {
            try {
              return await fetchJSON("/rankings?leaderboard=true");
            } catch {
              return [];
            }
          })(),
        ]);

        if (cancelled) return;

        const normalizedTemps = (ts || []).map((t) => ({
          ...t,
          _name: seasonNameOf(t),
          _startISO: seasonStartISO(t),
        }));

        setTemporadas(normalizedTemps);
        setFederados(Array.isArray(fs) ? fs : []);

        const catsNorm = (Array.isArray(cats) ? cats : [])
          .map((c, i) => ({
            ...c,
            id: c?.id ?? null,
            nombre: String(c?.nombre ?? "").trim(),
            capacidad: Number(c?.capacidad ?? 0) || 0,
            orden: Number.isInteger(c?.orden) ? c.orden : i,
          }))
          .filter((c) => c.id);
        catsNorm.sort(
          (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)
        );
        setCategorias(catsNorm);

        const rkGlobal = Array.isArray(rkGlobalRaw) ? rkGlobalRaw : [];

        const rankedTempIDs = new Set(
          rkGlobal.map((x) => x.temporadaID).filter(Boolean)
        );
        const seasonsWithRank = normalizedTemps.filter((t) =>
          rankedTempIDs.has(t.id)
        );
        const activa = seasonsWithRank.find((t) => t.estado === "activa");
        const sorted = (
          seasonsWithRank.length ? seasonsWithRank : normalizedTemps
        ).sort((a, b) =>
          String(b._startISO).localeCompare(String(a._startISO))
        );
        const defaultSeason = activa?._name || sorted[0]?._name || "";
        if (!season) setSeason(defaultSeason);

        // Guess first tipo from rankings to preselect category/gender if not set yet
        const tipos = new Set(
          rkGlobal.map((x) => x.tipoDePartido).filter(Boolean)
        );
        const firstTipo = [...tipos][0] || "";
        const parsed = parseTipo(firstTipo);
        if (!category && parsed.category) setCategory(parsed.category);
        if (!gender && parsed.gender) setGender(parsed.gender);

        const deportesFound = new Set(
          rkGlobal
            .map((x) => (x.deporte || "").toLowerCase())
            .filter(Boolean)
        );
        if (!sport) {
          if (deportesFound.has("padel")) setSport("Padel");
          else if (deportesFound.has("tenis")) setSport("Tenis");
        }
      } catch (e) {
        if (!cancelled) setErr(normalizeError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDictionaries();
    loadBase();

    return () => {
      cancelled = true;
    };
  }, []); // base mount

  // Recompute gender options when category/filtros change
  useEffect(() => {
    const catApi = apiModalidad(category || "Singles");
    const gSet = new Set(
      (filtros || [])
        .filter((f) => f?.modalidad?.nombre === catApi)
        .map((f) => String(f?.genero?.nombre || "").toLowerCase())
        .filter(Boolean)
        .map((g) => titleCase(g))
    );
    const options = Array.from(gSet);
    if (options.length) {
      setGenderOptions(options);
      if (!options.includes(gender)) setGender(options[0]);
    } else {
      // fallback if no filtros yet for that modalidad
      const fallback = catApi === "single" ? ["Masculino", "Femenino"] : ["Masculino", "Femenino", "Mixto"];
      setGenderOptions(fallback);
      if (!fallback.includes(gender)) setGender(fallback[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, filtros]);

  // Fetch ALL rankings for selected sport
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
    if (sport) loadAllSeasonsForSport();
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
      if (!temporadaID || !category || !sport) return;

      const tipoDePartido = buildTipoFromUI(category);
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

  /* ------------------------- Availability (tipo & género) ------------------------- */
  // We still compute availability from rankings + federados so the UI disables
  // options with no data. The *options themselves* come from DB via filtros.
  const tipoAvailability = useMemo(() => {
    const selectedSeason = temporadas.find((tt) => tt._name === season);
    const temporadaID = selectedSeason?.id;
    const targetDeporte = uiSportToApi(sport);

    const universe = (rankingsAllForSport || [])
      .filter((rk) => (rk.deporte || "").toLowerCase() === targetDeporte)
      .filter((rk) => !temporadaID || rk.temporadaID === temporadaID);

    const tipos = new Set(universe.map((rk) => rk.tipoDePartido).filter(Boolean));
    const parsed = [...tipos].map(parseTipo);
    const hasSingles = parsed.some((p) => p.category === "Singles");
    const hasDobles = parsed.some((p) => p.category === "Dobles");

    const singlesRows = universe.filter(
      (rk) => parseTipo(rk.tipoDePartido).category === "Singles"
    );
    const doublesRows = universe.filter(
      (rk) => parseTipo(rk.tipoDePartido).category === "Dobles"
    );

    const hasMaleSingles = singlesRows.some(
      (rk) => genderById.get(rk.usuarioID) === "Masculino"
    );
    const hasFemaleSingles = singlesRows.some(
      (rk) => genderById.get(rk.usuarioID) === "Femenino"
    );

    const hasMaleDoubles = doublesRows.some(
      (rk) => genderById.get(rk.usuarioID) === "Masculino"
    );
    const hasFemaleDoubles = doublesRows.some(
      (rk) => genderById.get(rk.usuarioID) === "Femenino"
    );

    const gendersSingles = new Set([
      ...(hasMaleSingles ? ["Masculino"] : []),
      ...(hasFemaleSingles ? ["Femenino"] : []),
    ]);
    const gendersDobles = new Set([
      ...(hasMaleDoubles ? ["Masculino"] : []),
      ...(hasFemaleDoubles ? ["Femenino"] : []),
      ...(hasMaleDoubles && hasFemaleDoubles ? ["Mixto"] : []),
    ]);

    return { hasSingles, hasDobles, gendersSingles, gendersDobles };
  }, [rankingsAllForSport, temporadas, season, sport, genderById]);

  // If category becomes unavailable, flip to the available one
  useEffect(() => {
    if (
      category === "Singles" &&
      !tipoAvailability.hasSingles &&
      tipoAvailability.hasDobles
    ) {
      setCategory("Dobles");
    } else if (
      category === "Dobles" &&
      !tipoAvailability.hasDobles &&
      tipoAvailability.hasSingles
    ) {
      setCategory("Singles");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoAvailability]);

  // Keep selected gender inside allowed set (intersection with availability)
  useEffect(() => {
    const allowedFromFiltros = new Set(genderOptions);
    const allowedFromAvailability =
      category === "Singles"
        ? tipoAvailability.gendersSingles
        : tipoAvailability.gendersDobles;
    const finalAllowed = new Set(
      [...allowedFromFiltros].filter((g) => allowedFromAvailability?.has(g))
    );
    const fallback = [...(finalAllowed.size ? finalAllowed : allowedFromFiltros)];
    if (fallback.length && !fallback.includes(gender)) {
      setGender(fallback[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genderOptions, tipoAvailability, category]);

  /* ------------------------- Category buckets (visual rail & fallback) ------------------------- */
  const catBuckets = useMemo(() => {
    const sorted = [...(categorias || [])]
      .filter((c) => Number(c.capacidad) > 0)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
    let start = 1;
    return sorted.map((c) => {
      const size = Number(c.capacidad) || 0;
      const end = start + size - 1;
      const out = { start, end, nombre: c.nombre, orden: c.orden };
      start = end + 1;
      return out;
    });
  }, [categorias]);

  const categoriaByRank = (pos) => {
    const b = catBuckets.find((bb) => pos >= bb.start && pos <= bb.end);
    return b
      ? { nombre: b.nombre, orden: b.orden }
      : { nombre: "—", orden: null };
  };

  /* ------------------------- Rows (badge + fallback category by rank) ------------------------- */
  const filteredRows = useMemo(() => {
    const t = temporadas.find((tt) => tt._name === season);
    const temporadaID = t?.id;
    const targetTipo = buildTipoFromUI(category);
    const targetDeporte = uiSportToApi(sport);

    let rows = (rankingsRaw || [])
      .filter(
        (rk) =>
          (!temporadaID || rk.temporadaID === temporadaID) &&
          (rk.deporte || "").toLowerCase() === targetDeporte
      )
      .filter((rk) => {
        const pA = parseTipo(rk.tipoDePartido);
        const pB = parseTipo(targetTipo);
        return pA.category === pB.category;
      });

    if (category === "Singles") {
      rows = rows.filter((rk) => genderById.get(rk.usuarioID) === gender);
    } else {
      if (gender === "Masculino" || gender === "Femenino") {
        rows = rows.filter((rk) => genderById.get(rk.usuarioID) === gender);
      } else {
        rows = rows.filter((rk) => {
          const g = genderById.get(rk.usuarioID);
          return g === "Masculino" || g === "Femenino";
        });
      }
    }

    rows = rows
      .filter((rk) => Number.isFinite(Number(rk.puntos)))
      .map((rk) => {
        let cid = catIdOf(rk);
        if (!cid) cid = catIdByNombre(rk, categorias);
        const cat = cid ? categorias.find((c) => c.id === cid) : null;
        return {
          id: rk.id,
          name: nameById.get(rk.usuarioID) || rk.usuarioID,
          wins: Number(rk.partidosGanados ?? 0),
          losses: Number(rk.partidosPerdidos ?? 0),
          points: Number(rk.puntos) || 0,
          categoriaNombre:
            cat?.nombre || rk.categoriaNombre || rk.categoria || null,
          categoriaOrden: Number.isFinite(cat?.orden) ? cat.orden : null,
        };
      });

    if (query) {
      const q = normalizeStr(query);
      rows = rows.filter((r) => normalizeStr(r.name).includes(q));
    }

    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return rows.map((r, i) => {
      const rank = i + 1;
      if (!r.categoriaNombre) {
        const byPos = categoriaByRank(rank);
        return {
          ...r,
          rank,
          categoriaNombre: byPos.nombre,
          categoriaOrden: byPos.orden,
        };
      }
      return { ...r, rank };
    });
  }, [
    rankingsRaw,
    temporadas,
    season,
    category,
    gender,
    sport,
    query,
    nameById,
    genderById,
    categorias,
    catBuckets,
  ]);

  /* ------------------------- Bracket rail blocks OUTSIDE the card ------------------------- */
  const railBlocks = useMemo(() => {
    const N = filteredRows.length;
    if (!N || !catBuckets.length) return [];
    return catBuckets
      .map((b) => {
        const from = Math.max(1, b.start);
        const to = Math.min(N, b.end);
        const count = to - from + 1;
        if (count <= 0) return null;
        return {
          nombre: b.nombre,
          orden: b.orden,
          top: CARD_TOPBAR_PX + THEAD_PX + (from - 1) * ROW_PX,
          height: count * ROW_PX,
        };
      })
      .filter(Boolean);
  }, [filteredRows.length, catBuckets]);

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

  const CategoryBadge = ({ name, orden }) => (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-neutral-800/70 border-white/20"
      title={orden != null ? `orden #${orden}` : undefined}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
      {name || "—"}
    </span>
  );

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
              <div className="relative">
                <select
                  id="sport"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  aria-label="Deporte"
                >
                  {sportOptions.length === 0 ? (
                    <option value="">Sin deportes</option>
                  ) : (
                    sportOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                  ▾
                </span>
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
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                  ▾
                </span>
              </div>

              {/* Category (from DB/filtros) */}
              <div className="flex flex-row flex-wrap items-center gap-3">
                {categoryOptions.map((c) => {
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
                      title={
                        !isAvailable
                          ? "No hay rankings para esta categoría en la temporada seleccionada"
                          : undefined
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              {/* Gender (from DB/filtros, crossed with availability) */}
              <div className="flex flex-row flex-wrap items-center gap-2 ml-2">
                {genderOptions.map((g) => {
                  const allowedSet =
                    category === "Singles"
                      ? tipoAvailability.gendersSingles
                      : tipoAvailability.gendersDobles;
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
                      title={
                        !isAvailable
                          ? "No hay rankings para este género en la temporada/categoría seleccionada"
                          : undefined
                      }
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-full max-w-sm ml-2">
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
            {/* OUTER WRAPPER so the rail can live outside the card */}
            <div className="relative overflow-visible">
              {/* --- OUTSIDE BRACKET RAIL --- */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: 0,
                  transform: `translateX(-${RAIL_OUTSIDE_PX}px)`,
                  width: RAIL_W,
                }}
                aria-hidden
              >
                {/* vertical baseline starting at top of tbody (below top bar + thead) */}
                <div
                  className="absolute"
                  style={{
                    top: CARD_TOPBAR_PX + THEAD_PX,
                    left: RAIL_W - 18,
                    bottom: 0,
                    width: 2,
                    background: "rgba(255,255,255,.25)",
                  }}
                />
                {/* blocks */}
                {railBlocks.map((b, i) => (
                  <div
                    key={`${b.nombre}-${i}`}
                    className="absolute flex items-center"
                    style={{
                      top: b.top,
                      left: 0,
                      height: b.height,
                      width: RAIL_W,
                    }}
                  >
                    {/* left label */}
                    <div
                      className="text-white/90 text-sm font-semibold select-none pr-2 text-right"
                      style={{ width: RAIL_W - 22 }}
                      title={`Categoría: ${b.nombre}`}
                    >
                      {b.nombre}
                    </div>
                    {/* bracket piece */}
                    <div className="relative" style={{ width: 22, height: "100%" }}>
                      <div className="absolute left-0 top-1 bottom-1 w-1 rounded bg-white/25" />
                      <div className="absolute right-[6px] top-1 w-[12px] h-[2px] bg-white/25" />
                      <div className="absolute right-[6px] bottom-1 w-[12px] h-[2px] bg-white/25" />
                    </div>
                  </div>
                ))}
              </div>

              {/* --- CARD --- */}
              <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Top bar */}
                <div
                  className="flex items-center justify-between gap-4 px-6 py-4"
                  style={{ height: CARD_TOPBAR_PX }}
                >
                  <h2 className="text-xl sm:text-2xl font-bold" style={strokeSmall}>
                    {sport || "—"} · {category || "—"} · {gender || "—"}
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
                      <tr
                        className="bg-neutral-800/80 text-base sm:text-lg"
                        style={{ height: THEAD_PX }}
                      >
                        <th className="px-6 py-4 font-semibold border-y border-white/20">
                          Posición
                        </th>
                        <th className="px-6 py-4 font-semibold border-y border-white/20">
                          Jugador
                        </th>
                        <th className="px-6 py-4 font-semibold border-y border-white/20">
                          Categoría
                        </th>
                        <th className="px-6 py-4 font-semibold border-y border-white/20">
                          PG
                        </th>
                        <th className="px-6 py-4 font-semibold border-y border-white/20">
                          PP
                        </th>
                        <th className="px-6 py-4 font-semibold border-y border-white/20">
                          Puntos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-base sm:text-lg">
                      {!loading && filteredRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center border-t border-white/10 text-white/70"
                          >
                            {rankingsRaw.length === 0
                              ? "No hay rankings cargados."
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
                          style={{ height: ROW_PX }}
                        >
                          <td className="px-6 py-4 border-t border-white/10 font-extrabold">
                            {r.rank}
                          </td>
                          <td className="px-6 py-4 border-t border-white/10">
                            <div className="flex items-center gap-3">
                              <span className="truncate">
                                {renderHighlightedName(r.name, query)}
                              </span>
                              {r.rank === 1 && (
                                <Crown
                                  className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,255,0,0.75)]"
                                  aria-hidden
                                  fill="currentColor"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-t border-white/10">
                            <CategoryBadge
                              name={r.categoriaNombre}
                              orden={r.categoriaOrden}
                            />
                          </td>
                          <td className="px-6 py-4 border-t border-white/10">
                            {Number.isFinite(r.wins) ? r.wins : "—"}
                          </td>
                          <td className="px-6 py-4 border-t border-white/10">
                            {Number.isFinite(r.losses) ? r.losses : "—"}
                          </td>
                          <td className="px-6 py-4 border-t border-white/10 font-semibold">
                            {r.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
