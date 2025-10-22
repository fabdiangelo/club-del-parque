import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import { Crown, Search, X } from "lucide-react";
import { useAuth } from "../contexts/AuthProvider";


/* ------------------------------- utils ------------------------------- */
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
const titleCase = (s = "") =>
  String(s).toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const uiSportToApi = (label = "") =>
  normalizeStr(label).includes("padel") ? "padel" : "tenis";

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

/* filtro.modalidad -> tipo ("singles"|"dobles") */
const tipoFromFiltro = (filtro) => {
  const m = (filtro?.modalidad?.nombre || "").toLowerCase();
  if (["doble", "dobles", "double", "doubles"].includes(m)) return "dobles";
  return "singles";
};

/* display name helpers */
const emailLocal = (s = "") => String(s).split("@")[0];
const displayNameFromFederado = (u = {}) => {
  const full = [u.nombre, u.apellido].filter(Boolean).join(" ").trim();
  return (
    full || u.displayName || u.nombre || emailLocal(u.email || "") || u.alias || ""
  );
};

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
      <mark className="bg-yellow-200/50 rounded px-0.5">{match}</mark>
      {after}
    </>
  );
};

/* Cute animated header title (puremente estético) */
function AnimatedTitle({ text, className, style }) {
  return (
    <>
      <style>{`
        @keyframes subtleGlow {
          0%, 30%, 50% { color: #0f172a; text-shadow: none; }
          20% {
            color: #1f2937;
            text-shadow: 0 0 6px rgba(255,255,255,.35);
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

/* ------------------------------- page ------------------------------- */
export default function Rankings() {
  // dictionaries
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const [deportes, setDeportes] = useState([]);
  const [filtros, setFiltros] = useState([]);
  const [temporadas, setTemporadas] = useState([]);
  const [federados, setFederados] = useState([]);

  // UI selections
  const [sportOptions, setSportOptions] = useState([]);
  const [sport, setSport] = useState("");
  const [season, setSeason] = useState("");
  const [selectedFiltroId, setSelectedFiltroId] = useState(""); // required
  const [query, setQuery] = useState("");

  // data
  const [rankingsRaw, setRankingsRaw] = useState([]);
  const [rkCategorias, setRkCategorias] = useState([]);

  // states
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal Add-to-ranking
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingFederados, setLoadingFederados] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignCategoriaId, setAssignCategoriaId] = useState("");
  const [assignPoints, setAssignPoints] = useState("");

  // GESTOR DE CATEGORÍAS (modal)
  const [showManager, setShowManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatCap, setNewCatCap] = useState(32);
  const [busy, setBusy] = useState(false);
  const [rkLocalOrder, setRkLocalOrder] = useState([]); // ids en orden (mejor→peor)

  /* boot (load dictionaries + federados so we can resolve names) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [deps, filts, ts, fed] = await Promise.all([
          fetchJSON("/deportes"),
          fetchJSON("/filtros"),
          fetchJSON("/temporadas"),
          fetchJSON("/usuarios/federados"),
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
        if (!sport && depsNorm.length) setSport(depsNorm[0].nombre);

        const filtsNorm = Array.isArray(filts)
          ? filts.map((f) => ({
              ...f,
              modalidad: { nombre: String(f?.modalidad?.nombre || "").toLowerCase() },
              genero: { nombre: String(f?.genero?.nombre || "").toLowerCase() },
            }))
          : [];
        setFiltros(filtsNorm);
        if (!selectedFiltroId && filtsNorm.length)
          setSelectedFiltroId(String(filtsNorm[0].id));

        const normalizedTemps = (ts || []).map((t) => ({
          ...t,
          _name: seasonNameOf(t),
          _startISO: seasonStartISO(t),
        }));
        setTemporadas(normalizedTemps);
        const activa = normalizedTemps.find((t) => t.estado === "activa");
        const sorted = [...normalizedTemps].sort((a, b) =>
          String(b._startISO).localeCompare(String(a._startISO))
        );
        const defaultSeason = activa?._name || sorted[0]?._name || "";
        if (!season) setSeason(defaultSeason);

        setFederados(Array.isArray(fed) ? fed : []);
      } catch (e) {
        if (!cancelled) setErr(normalizeError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* derived scope */
  const scope = useMemo(() => {
    const t = temporadas.find((tt) => tt._name === season);
    const filtro = filtros.find((f) => String(f.id) === String(selectedFiltroId));
    return {
      temporadaID: t?.id || null,
      deporte: uiSportToApi(sport),
      tipoDePartido: filtro ? tipoFromFiltro(filtro) : null,
      filtroId: selectedFiltroId || null,
      filtroLabel: filtro ? buildFilterLabel(filtro) : "",
    };
  }, [temporadas, season, sport, filtros, selectedFiltroId]);

  /* ranking-categorías for scope */
  useEffect(() => {
    const loadRankingCategorias = async () => {
      try {
        if (!scope.temporadaID || !scope.tipoDePartido) {
          setRkCategorias([]);
          setRkLocalOrder([]);
          return;
        }
        const qs = new URLSearchParams({
          temporadaID: scope.temporadaID,
          deporte: scope.deporte,
          tipoDePartido: scope.tipoDePartido,
        });
        if (scope.filtroId != null) qs.set("filtroId", scope.filtroId);
        const rows = await fetchJSON(`/ranking-categorias?${qs.toString()}`);
        const list = Array.isArray(rows) ? rows : [];
        list.sort(
          (a, b) =>
            a.orden - b.orden ||
            String(a?.nombre || "").localeCompare(String(b?.nombre || ""))
        );
        setRkCategorias(list);
        setRkLocalOrder(list.map((c) => c.id));
      } catch (e) {
        console.error(e);
      }
    };
    loadRankingCategorias();
  }, [scope.temporadaID, scope.deporte, scope.tipoDePartido, scope.filtroId]);

  /* load leaderboard for scope */
  useEffect(() => {
    let cancelled = false;
    async function loadRankings() {
      const { temporadaID, deporte, tipoDePartido, filtroId } = scope;
      if (!temporadaID || !deporte || !tipoDePartido || !filtroId) {
        setRankingsRaw([]);
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const params = new URLSearchParams({
          temporadaID,
          deporte,
          tipoDePartido,
          filtroId: String(filtroId),
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
    if (scope.temporadaID && scope.filtroId && scope.tipoDePartido) loadRankings();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  /* maps */
  const nameById = useMemo(() => {
    const m = new Map();
    (federados || []).forEach((u, i) => {
      const id = u.id || u.uid || u.email || String(i);
      const name = displayNameFromFederado(u) || id;
      m.set(id, name);
      if (u.id) m.set(u.id, name);
      if (u.uid) m.set(u.uid, name);
      if (u.email) m.set(u.email, name);
    });
    return m;
  }, [federados]);

  const catMetaById = useMemo(() => {
    const m = new Map();
    (rkCategorias || []).forEach((c) =>
      m.set(c.id, { nombre: c.nombre, orden: c.orden })
    );
    return m;
  }, [rkCategorias]);

  /* ----------- GROUPED rows (by categoría) con empates y corona ----------- */
  const grouped = useMemo(() => {
    const items = (rankingsRaw || []).map((rk) => {
      const name = nameById.get(rk.usuarioID) || rk.usuarioID;
      const catId = rk.categoriaId ?? null;
      const meta = (catId && catMetaById.get(catId)) || null;
      return {
        id: rk.id,
        usuarioID: rk.usuarioID,
        name,
        wins: Number(rk.partidosGanados ?? 0),
        losses: Number(rk.partidosPerdidos ?? 0),
        points: Number(rk.puntos ?? 0),
        categoriaId: catId,
        categoriaNombre: meta?.nombre || "Sin categoría",
        categoriaOrden: Number.isFinite(meta?.orden) ? meta.orden : 1e9,
      };
    });

    const q = normalizeStr(query);
    const filtered = q
      ? items.filter((r) => normalizeStr(r.name).includes(q))
      : items;

    const byCat = new Map();
    for (const r of filtered) {
      const key = String(r.categoriaId ?? "uncat");
      if (!byCat.has(key)) {
        byCat.set(key, {
          categoriaId: r.categoriaId ?? null,
          categoriaNombre: r.categoriaNombre,
          categoriaOrden: r.categoriaOrden,
          rows: [],
        });
      }
      byCat.get(key).rows.push(r);
    }

    const groups = Array.from(byCat.values()).sort(
      (a, b) =>
        a.categoriaOrden - b.categoriaOrden ||
        a.categoriaNombre.localeCompare(b.categoriaNombre)
    );

    for (const g of groups) {
      g.rows.sort((a, b) =>
        b.points !== a.points
          ? b.points - a.points
          : a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      let lastPts = null;
      let lastRank = 0;
      g.rows = g.rows.map((r, idx) => {
        const rank = lastPts === r.points ? lastRank : idx + 1;
        lastPts = r.points;
        lastRank = rank;
        return { ...r, rankInCat: rank };
      });
    }

    return groups;
  }, [rankingsRaw, nameById, catMetaById, query]);

  const seasonOptions = useMemo(() => {
    const sorted = [...temporadas].sort((a, b) =>
      String(b._startISO).localeCompare(String(a._startISO))
    );
    return sorted.map((t) => t._name);
  }, [temporadas]);

  const filtroOptions = useMemo(
    () =>
      (filtros || []).map((f) => ({ id: String(f.id), label: buildFilterLabel(f) })),
    [filtros]
  );

  const reloadRankings = async () => {
    const { temporadaID, deporte, tipoDePartido, filtroId } = scope;
    if (!temporadaID || !deporte || !tipoDePartido || !filtroId) return;
    try {
      const params = new URLSearchParams({
        temporadaID,
        deporte,
        tipoDePartido,
        filtroId: String(filtroId),
        leaderboard: "true",
      });
      const rk = await fetchJSON(`/rankings?${params.toString()}`);
      setRankingsRaw(Array.isArray(rk) ? rk : []);
    } catch {
      setRankingsRaw([]);
    }
  };

  const openAddModal = async () => {
    setAssignUserId("");
    setAssignCategoriaId("");
    setAssignPoints("");
    if (!federados.length) {
      setLoadingFederados(true);
      try {
        const fs = await fetchJSON("/usuarios/federados");
        setFederados(Array.isArray(fs) ? fs : []);
      } catch (e) {
        alert(normalizeError(e));
      } finally {
        setLoadingFederados(false);
      }
    }
    setShowAddModal(true);
  };

  const assignToRanking = async () => {
    const usuarioID = String(assignUserId || "").trim();
    if (!usuarioID) return alert("Elegí un federado");
    if (!scope.temporadaID || !scope.tipoDePartido || !scope.filtroId)
      return alert("Falta seleccionar temporada/filtro/tipo.");
    try {
      await fetchJSON(`/federados/${encodeURIComponent(usuarioID)}/categoria`, {
        method: "PATCH",
        body: JSON.stringify({
          categoriaId: assignCategoriaId || null,
          temporadaID: scope.temporadaID,
          deporte: scope.deporte,
          tipoDePartido: scope.tipoDePartido,
          filtroId: scope.filtroId ?? null,
          puntos:
            assignPoints === "" || assignPoints === null
              ? undefined
              : Number(assignPoints),
        }),
      });
      await reloadRankings();
      setShowAddModal(false);
    } catch (e) {
      alert(normalizeError(e));
    }
  };

  const createCategoria = async (e) => {
    e?.preventDefault?.();
    if (!scope.temporadaID || !scope.tipoDePartido) return;
    const nm = String(newCatName || "").trim();
    const cap = Number(newCatCap);
    if (!nm) return alert("Nombre obligatorio");
    if (!Number.isInteger(cap) || cap < 4) return alert("Capacidad inválida");
    setBusy(true);
    try {
      const body = {
        temporadaID: scope.temporadaID,
        deporte: scope.deporte,
        tipoDePartido: scope.tipoDePartido,
        filtroId: scope.filtroId,
        nombre: nm,
        capacidad: cap,
      };
      await fetchJSON("/ranking-categorias", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setNewCatName("");
      setNewCatCap(32);
      const qs = new URLSearchParams({
        temporadaID: scope.temporadaID,
        deporte: scope.deporte,
        tipoDePartido: scope.tipoDePartido,
      });
      if (scope.filtroId != null) qs.set("filtroId", scope.filtroId);
      const rows = await fetchJSON(`/ranking-categorias?${qs.toString()}`);
      const list = Array.isArray(rows) ? rows : [];
      list.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
      setRkCategorias(list);
      setRkLocalOrder(list.map((c) => c.id));
    } catch (e) {
      alert(normalizeError(e));
    } finally {
      setBusy(false);
    }
  };

  const moveUp = (id) =>
    setRkLocalOrder((arr) => {
      const i = arr.indexOf(id);
      if (i <= 0) return arr;
      const copy = arr.slice();
      [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
      return copy;
    });

  const moveDown = (id) =>
    setRkLocalOrder((arr) => {
      const i = arr.indexOf(id);
      if (i < 0 || i === arr.length - 1) return arr;
      const copy = arr.slice();
      [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
      return copy;
    });

  const saveRkOrder = async () => {
    if (!scope.temporadaID || !scope.tipoDePartido) return;
    try {
      await fetchJSON("/ranking-categorias/orden", {
        method: "PATCH",
        body: JSON.stringify({
          temporadaID: scope.temporadaID,
          deporte: scope.deporte,
          tipoDePartido: scope.tipoDePartido,
          filtroId: scope.filtroId,
          ids: rkLocalOrder,
        }),
      });
      const qs = new URLSearchParams({
        temporadaID: scope.temporadaID,
        deporte: scope.deporte,
        tipoDePartido: scope.tipoDePartido,
      });
      if (scope.filtroId != null) qs.set("filtroId", scope.filtroId);
      const rows = await fetchJSON(`/ranking-categorias?${qs.toString()}`);
      const list = Array.isArray(rows) ? rows : [];
      list.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
      setRkCategorias(list);
      setRkLocalOrder(list.map((c) => c.id));
      alert("Orden guardado");
    } catch (e) {
      alert(normalizeError(e));
    }
  };

  /* ------------------------------- render ------------------------------- */
  return (
    <div className="relative min-h-screen w-full text-neutral-900">
      {/* Fondo gradiente animado */}
      <style>{`
        @keyframes moveGradient {
          0% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(120deg, #f8fafc, #e0f2fe, #fef9c3, #e9d5ff, #f8fafc)",
          backgroundSize: "400% 400%",
          animation: "moveGradient 40s ease-in-out infinite",
        }}
      />
      {/* capa de brillo muy sutil */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/30 backdrop-blur-[1px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <NavbarBlanco />

        {/* Header */}
        <header className="w-full">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center pt-20 pb-6">
            <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight">
              <AnimatedTitle text="Ranking" />
            </h1>

            {/* Controles */}
            <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
              {/* Sport */}
              <div className="relative">
                <select
                  aria-label="Deporte"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-neutral-300 bg-white/90 shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  {sportOptions.length === 0 ? (
                    <option value="">—</option>
                  ) : (
                    sportOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  ▾
                </span>
              </div>

              {/* Season */}
              <div className="relative">
                <select
                  aria-label="Temporada"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-neutral-300 bg-white/90 shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                >
                  {seasonOptions.length === 0 ? (
                    <option value="">—</option>
                  ) : (
                    seasonOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  ▾
                </span>
              </div>

              {/* Filtro */}
              <div className="relative">
                <select
                  aria-label="Filtro"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-neutral-300 bg-white/90 shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
                  value={selectedFiltroId}
                  onChange={(e) => setSelectedFiltroId(e.target.value)}
                  title={scope.filtroLabel || "Filtro"}
                >
                  {filtroOptions.length === 0 ? (
                    <option value="">No hay filtros</option>
                  ) : (
                    filtroOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))
                  )}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  ▾
                </span>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-sm ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" aria-hidden />
                <input
                  type="search"
                  inputMode="search"
                  placeholder="Buscar jugador"
                  className="w-full h-11 rounded-lg border border-neutral-300 bg-white/90 pl-9 pr-10 text-base placeholder-neutral-500 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-neutral-100"
                    onClick={() => setQuery("")}
                  >
                    <X className="w-5 h-5 text-neutral-600" />
                  </button>
                )}
              </div>

             {isAdmin && (
    <Link to="/temporadas" className="ml-2">
      <button className="h-11 px-4 rounded-lg border border-neutral-300 bg-white/90 hover:bg-white shadow-sm">
        Crear Temporadas
      </button>
    </Link>
  )}

  {isAdmin && (
    <button
      onClick={openAddModal}
      disabled={!scope.temporadaID || !scope.filtroId || !scope.tipoDePartido}
      className="h-11 px-4 rounded-lg border border-neutral-300 bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 shadow-sm"
      title="Agregar un federado al ranking (popup)"
    >
      Agregar al ranking
    </button>
  )}

  {isAdmin && (
    <button
      onClick={() => setShowManager(true)}
      disabled={!scope.temporadaID || !scope.filtroId || !scope.tipoDePartido}
      className="h-11 px-4 rounded-lg border border-neutral-300 bg-white/90 hover:bg-white disabled:opacity-40 shadow-sm"
      title="Crear y ordenar categorías (mejor→peor) del scope actual"
    >
      Gestionar categorías
    </button>
  )}
</div>

            {/* Status */}
            <div className="mt-4 text-sm text-neutral-700">
              {!selectedFiltroId && <p>Elegí un filtro para ver/gestionar el ranking.</p>}
              {loading && <p>Cargando…</p>}
              {err && <p className="text-red-600">Error: {err}</p>}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20">
            {/* Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white/85 shadow-2xl backdrop-blur overflow-hidden">
              {/* Top bar */}
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {sport || "—"} · {season || "—"} · {scope.tipoDePartido || "—"} · {scope.filtroLabel || "Filtro"}
                </h2>
              </div>

              {/* Hierarchical sections */}
              {(!loading && grouped.length === 0) ? (
                <div className="px-6 py-12 text-center text-neutral-600">
                  No hay datos de ranking aún.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {grouped.map((group) => (
                    <section key={String(group.categoriaId ?? "uncat")} className="px-2 sm:px-4">
                      {/* Sticky section header (light) */}
                      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-4 py-3 border-b border-neutral-200 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl font-extrabold">
                            {group.categoriaNombre}
                          </span>
                          {Number.isFinite(group.categoriaOrden) && group.categoriaOrden < 1e9 && (
                            <span className="text-xs sm:text-sm text-neutral-500">
                              
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto pb-4">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-neutral-100 text-base sm:text-lg">
                              <th className="px-4 sm:px-6 py-3 font-semibold border-y border-neutral-200">Posición</th>
                              <th className="px-4 sm:px-6 py-3 font-semibold border-y border-neutral-200">Jugador</th>
                              <th className="px-4 sm:px-6 py-3 font-semibold border-y border-neutral-200">PG</th>
                              <th className="px-4 sm:px-6 py-3 font-semibold border-y border-neutral-200">PP</th>
                              <th className="px-4 sm:px-6 py-3 font-semibold border-y border-neutral-200">Puntos</th>
                            </tr>
                          </thead>
                          <tbody className="text-base sm:text-lg">
                            {group.rows.map((r, i) => (
                              <tr
                                key={r.id}
                                className={`transition-colors hover:bg-neutral-50 ${
                                  i % 2 === 0 ? "bg-white" : "bg-neutral-50/40"
                                }`}
                              >
                                <td className="px-4 sm:px-6 py-3 border-t border-neutral-200 font-extrabold whitespace-nowrap">
                                  {r.rankInCat}
                                  {r.rankInCat === 1 && (
                                    <Crown
                                      className="inline-block ml-2 w-5 h-5 text-yellow-500 align-text-bottom"
                                      aria-hidden
                                      fill="currentColor"
                                    />
                                  )}
                                </td>
                                <td className="px-4 sm:px-6 py-3 border-t border-neutral-200">
                                  {renderHighlightedName(r.name, query)}
                                </td>
                                <td className="px-4 sm:px-6 py-3 border-t border-neutral-200">
                                  {Number.isFinite(r.wins) ? r.wins : "—"}
                                </td>
                                <td className="px-4 sm:px-6 py-3 border-t border-neutral-200">
                                  {Number.isFinite(r.losses) ? r.losses : "—"}
                                </td>
                                <td className="px-4 sm:px-6 py-3 border-t border-neutral-200 font-semibold">
                                  {r.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add-to-ranking Modal (light) */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white text-neutral-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
              <h3 className="text-lg font-extrabold">Agregar federado al ranking</h3>
              <span className="ml-auto text-xs text-neutral-500">
                Scope: <b>{sport}</b> · <b>{season}</b> · <b>{scope.tipoDePartido || "—"}</b> · <b>{scope.filtroLabel}</b>
              </span>
            </div>

            <div className="p-5 grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Federado</label>
                <select
                  className="h-10 px-3 rounded-lg border border-neutral-300"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                >
                  <option value="">— Elegí un federado —</option>
                  {(federados || []).map((u, i) => {
                    const id = u.id || u.uid || u.email || String(i);
                    const name = displayNameFromFederado(u) || id;
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
                {loadingFederados && <small className="text-neutral-600">Cargando federados…</small>}
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Categoría (opcional)</label>
                <select
                  className="h-10 px-3 rounded-lg border border-neutral-300"
                  value={assignCategoriaId}
                  onChange={(e) => setAssignCategoriaId(e.target.value)}
                >
                  <option value="">— Sin categoría —</option>
                  {rkCategorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.orden} · {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">
                  Puntos iniciales (opcional — vacío usa “top de la categoría inferior” o 0)
                </label>
                <input
                  className="h-10 px-3 rounded-lg border border-neutral-300"
                  type="number"
                  inputMode="numeric"
                  value={assignPoints}
                  onChange={(e) => setAssignPoints(e.target.value)}
                  placeholder="Ej. 150"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  className="h-10 px-4 rounded-lg border border-neutral-300 hover:bg-neutral-50"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="h-10 px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
                  onClick={assignToRanking}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GESTOR DE CATEGORÍAS (light) */}
      {showManager && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManager(false);
          }}
        >
          <div className="w-full max-w-4xl bg-white text-neutral-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
              <h3 className="text-lg font-extrabold">Gestor de categorías (mejor → peor)</h3>
              <span className="ml-auto text-xs text-neutral-500">
                Scope: <b>{sport}</b> · <b>{season}</b> · <b>{scope.tipoDePartido || "—"}</b> · <b>{scope.filtroLabel}</b>
              </span>
              <button
                className="ml-3 h-9 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-50"
                onClick={() => setShowManager(false)}
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={createCategoria} className="p-5 flex flex-wrap gap-3 items-end">
              <div className="grid">
                <label className="text-xs text-neutral-600">Nombre</label>
                <input
                  className="h-10 px-3 rounded-lg border border-neutral-300"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder='Ej: "Hierro", "Bronce", "Oro"'
                />
              </div>
              <div className="grid">
                <label className="text-xs text-neutral-600">Capacidad</label>
                <select
                  className="h-10 px-3 rounded-lg border border-neutral-300"
                  value={newCatCap}
                  onChange={(e) => setNewCatCap(Number(e.target.value))}
                >
                  {[4, 8, 16, 32, 64, 128, 256].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={busy || !scope.temporadaID || !scope.tipoDePartido}
                className="h-10 px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40"
              >
                {busy ? "Creando…" : "Crear categoría"}
              </button>
            </form>

            <div className="px-5 pb-5">
              {rkCategorias.length === 0 ? (
                <div className="p-4 border-t border-neutral-200 text-sm">No hay categorías en este scope.</div>
              ) : (
                <>
                  <div className="text-xs text-neutral-600 mb-2">
                    Arriba = mejor. Reordená con ↑/↓ y guardá.
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="px-4 py-3 border-b border-neutral-200">Orden</th>
                          <th className="px-4 py-3 border-b border-neutral-200">Nombre</th>
                          <th className="px-4 py-3 border-b border-neutral-200">Capacidad</th>
                          <th className="px-4 py-3 border-b border-neutral-200">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rkLocalOrder.map((id, idx) => {
                          const c = rkCategorias.find((x) => x.id === id);
                          if (!c) return null;
                          return (
                            <tr key={id} className={idx % 2 ? "" : "bg-neutral-50"}>
                              <td className="px-4 py-3 border-b border-neutral-200 font-bold">#{idx}</td>
                              <td className="px-4 py-3 border-b border-neutral-200">{c.nombre}</td>
                              <td className="px-4 py-3 border-b border-neutral-200">{c.capacidad}</td>
                              <td className="px-4 py-3 border-b border-neutral-200">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => moveUp(id)}
                                    disabled={idx <= 0}
                                    className="h-9 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => moveDown(id)}
                                    disabled={idx >= rkLocalOrder.length - 1}
                                    className="h-9 px-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
                                  >
                                    ↓
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={saveRkOrder}
                      className="h-10 px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
                    >
                      Guardar orden
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helper de etiqueta de filtro */
function buildFilterLabel(f) {
  const parts = [];
  const mod = f?.modalidad?.nombre || "";
  const gen = f?.genero?.nombre || "";
  if (mod) parts.push(mod === "doble" ? "Dobles" : "Singles");
  if (gen) parts.push(titleCase(gen));
  if (f?.edadMin != null || f?.edadMax != null)
    parts.push(`Edad ${f.edadMin ?? "?"}-${f.edadMax ?? "?"}`);
  if (f?.pesoMin != null || f?.pesoMax != null)
    parts.push(`Peso ${f.pesoMin ?? "?"}-${f.pesoMax ?? "?"}`);
  return parts.join(" · ") || "Filtro";
}
