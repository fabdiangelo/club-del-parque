// src/pages/CanchasGestor.jsx (tema claro)
import React, { useEffect, useMemo, useState } from "react";
import NavbarBlanco from "../components/NavbarBlanco";
import { Plus, Search, X, Trash2, RefreshCw, Eye, Loader2 } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png"; // reutilizamos el mismo fondo para coherencia visual

const NAVBAR_OFFSET_REM = 5;
const SPORTS = ["Tenis", "Padel"]; // mismos labels que Rankings

/* ------------------------- HTTP helpers (mismo estilo que Rankings) ------------------------- */
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
const normalizeStr = (s = "") => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/* ------------------------- UI bits reused ------------------------- */
function AnimatedTitle({ text, className, style }) {
  return (
    <>
      <style>{`
        @keyframes subtleGlow { 0%, 30%, 50% { color: #0f172a; text-shadow: none; } 20% { color: #0b3b5e; text-shadow: 0 0 6px rgba(14, 165, 233, .25), 0 0 12px rgba(14, 165, 233, .15); } }
        .glow-letter:hover { animation-play-state: paused; }
      `}</style>
      <span className={className} style={style}>
        {text.split("").map((ch, i) => (
          <span key={i} className="glow-letter inline-block" style={{ animation: "subtleGlow 18s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </>
  );
}

// Para el tema claro, reducimos sombras fuertes y usamos trazos suaves
const strokeTitle = {
  color: "#0f172a", // slate-900
  WebkitTextStroke: "0.8px rgba(255,255,255,0.8)",
  textShadow: "0 1px 0 rgba(255,255,255,.6)",
};
const strokeSmall = {
  color: "#0f172a",
  WebkitTextStroke: "0.25px rgba(255,255,255,0.8)",
  textShadow: "0 1px 0 rgba(255,255,255,.6)",
};

/* ------------------------------------ Page ------------------------------------ */
export default function CanchasGestor() {
  // Listado y estados
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filtros
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("Todos");

  // Crear cancha
  const [nombre, setNombre] = useState("");
  const [deporte, setDeporte] = useState(SPORTS[0]);
  const [creating, setCreating] = useState(false);

  // Detalle
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cargar todas
  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchJSON("/canchas");
      setCanchas(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, []);

  // Crear
  async function handleCreate(e) {
    e?.preventDefault?.();
    if (!nombre.trim()) {
      setErr("El nombre es obligatorio.");
      return;
    }
    setCreating(true);
    setErr("");
    try {
      await fetchJSON("/canchas", { method: "POST", body: JSON.stringify({ nombre: nombre.trim(), deporte }) });
      setNombre("");
      setDeporte(SPORTS[0]);
      await loadAll();
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setCreating(false);
    }
  }

  // Eliminar
  async function handleDelete(id) {
    const ok = window.confirm("¿Eliminar la cancha? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await fetchJSON(`/canchas/${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadAll();
    } catch (e) {
      setErr(normalizeError(e));
    }
  }

  // Ver detalle
  async function openDetail(id) {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await fetchJSON(`/canchas/${encodeURIComponent(id)}`);
      setDetail(data);
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setDetailLoading(false);
    }
  }
  function closeDetail() {
    setDetailId(null);
    setDetail(null);
  }

  // Filtrado en memoria
  const filtered = useMemo(() => {
    let list = [...canchas];
    const q = normalizeStr(query);
    if (q) list = list.filter((c) => normalizeStr(c?.nombre || "").includes(q));
    if (sportFilter !== "Todos") list = list.filter((c) => (c?.deporte || "").toLowerCase() === sportFilter.toLowerCase());
    return list.sort((a, b) => (a?.nombre || "").localeCompare(b?.nombre || "", undefined, { sensitivity: "base" }));
  }, [canchas, query, sportFilter]);

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      {/* Background */}
      <div aria-hidden className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url(${bgImg})` }} />
      {/* overlay clara para legibilidad */}
      <div className="fixed inset-0 z-0 bg-white/70 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <NavbarBlanco />

        {/* Header */}
        <header className="w-full">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center" style={{ paddingTop: `${NAVBAR_OFFSET_REM}rem`, paddingBottom: "1.25rem" }}>
            <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight drop-shadow" style={strokeTitle}>
              <AnimatedTitle text="Gestor de Canchas" />
            </h1>

            {/* Controls */}
            <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
              {/* Sport Filter */}
              <div className="relative">
                <select
                  id="sportFilter"
                  className="h-12 pl-4 pr-10 text-lg rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  aria-label="Filtrar por deporte"
                >
                  {["Todos", ...SPORTS].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-sm ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" aria-hidden />
                <input
                  id="cancha-search"
                  type="text"
                  inputMode="search"
                  placeholder="Buscar cancha por nombre"
                  className="w-full h-11 rounded-lg border border-slate-300 bg-white text-slate-900 pl-9 pr-10 text-base placeholder-slate-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button type="button" aria-label="Limpiar búsqueda" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-slate-100" onClick={() => setQuery("")}> 
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                )}
              </div>

              {/* Create form */}
              <form onSubmit={handleCreate} className="flex flex-row flex-wrap items-center gap-3 ml-2">
                <input
                  type="text"
                  placeholder="Nombre de la cancha"
                  className="w-56 h-11 rounded-lg border border-slate-300 bg-white text-slate-900 px-3 text-base placeholder-slate-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <div className="relative">
                  <select
                    id="deporte"
                    className="h-11 pl-3 pr-9 text-base rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    value={deporte}
                    onChange={(e) => setDeporte(e.target.value)}
                    aria-label="Deporte"
                  >
                    {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className={`h-11 px-4 rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 active:scale-[.98] shadow-sm bg-cyan-600 text-white border-cyan-700 ${creating ? "opacity-60 cursor-wait" : "hover:bg-cyan-500"}`}
                  title="Crear cancha"
                >
                  {creating ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Creando…</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Plus className="w-4 h-4"/>Crear cancha</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={loadAll}
                  className="h-11 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 shadow-sm active:scale-[.98]"
                  title="Refrescar"
                >
                  <RefreshCw className="w-4 h-4"/>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20">
            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <h2 className="text-xl sm:text-2xl font-bold" style={strokeSmall}>Canchas {sportFilter !== "Todos" ? `· ${sportFilter}` : ""}</h2>
                {(loading || err) && (
                  <div className="text-sm text-slate-700" aria-live="polite">{loading ? "Cargando datos…" : `Error: ${err}`}</div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-base sm:text-lg">
                      <th className="px-6 py-4 font-semibold border-y border-slate-200">Nombre</th>
                      <th className="px-6 py-4 font-semibold border-y border-slate-200">Deporte</th>
                      <th className="px-6 py-4 font-semibold border-y border-slate-200 w-40">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center border-t border-slate-200 text-slate-500">{canchas.length === 0 ? "No hay canchas cargadas." : `Sin resultados para "${query}".`}</td>
                      </tr>
                    )}

                    {loading && (
                      [...Array(4)].map((_, i) => (
                        <tr key={`sk-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          {Array.from({ length: 3 }).map((__, j) => (
                            <td key={`sk-${i}-${j}`} className="px-6 py-4 border-t border-slate-200">
                              <div className="h-5 w-full max-w-[16rem] animate-pulse rounded bg-slate-200" />
                            </td>
                          ))}
                        </tr>
                      ))
                    )}

                    {!loading && filtered.map((c, i) => (
                      <tr key={c.id || c._id || `${c.nombre}-${i}`} className={`transition-colors hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                        <td className="px-6 py-4 border-t border-slate-200">{c?.nombre || "(sin nombre)"}</td>
                        <td className="px-6 py-4 border-t border-slate-200">{c?.deporte || "—"}</td>
                        <td className="px-6 py-4 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <button
                              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 shadow-sm active:scale-[.98]"
                              onClick={() => openDetail(c.id || c._id)}
                              title="Ver detalle"
                            >
                              <span className="inline-flex items-center gap-2"><Eye className="w-4 h-4"/>Detalle</span>
                            </button>
                            <button
                              className="h-9 px-3 rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 active:scale-[.98] shadow-sm bg-rose-600 text-white border-rose-700 hover:bg-rose-500"
                              onClick={() => handleDelete(c.id || c._id)}
                              title="Eliminar"
                            >
                              <span className="inline-flex items-center gap-2"><Trash2 className="w-4 h-4"/>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 text-xs text-slate-500 border-t border-slate-200">Gestioná canchas: crear, listar, ver detalle y eliminar.</div>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Drawer */}
      {detailId !== null && (
        <div className="fixed inset-0 z-20 flex">
          <div className="flex-1" onClick={closeDetail} />
          <aside className="w-full max-w-md h-full bg-white text-slate-900 border-l border-slate-200 shadow-2xl backdrop-blur-md p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold" style={strokeSmall}>Detalle de cancha</h3>
              <button onClick={closeDetail} className="rounded-md p-2 hover:bg-slate-100" aria-label="Cerrar"><X className="w-5 h-5"/></button>
            </div>
            {detailLoading ? (
              <div className="flex items-center gap-2 text-slate-700"><Loader2 className="w-4 h-4 animate-spin"/>Cargando…</div>
            ) : detail ? (
              <div className="space-y-3">
                <div><span className="text-slate-500 text-sm">ID</span><div className="font-mono break-all">{detail.id || detail._id || "—"}</div></div>
                <div><span className="text-slate-500 text-sm">Nombre</span><div className="text-lg">{detail.nombre || "—"}</div></div>
                <div><span className="text-slate-500 text-sm">Deporte</span><div className="text-lg">{detail.deporte || "—"}</div></div>
                {Object.keys(detail).length > 3 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer select-none text-slate-700">Ver JSON completo</summary>
                    <pre className="mt-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">{JSON.stringify(detail, null, 2)}</pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-slate-700">No se encontró información.</div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
