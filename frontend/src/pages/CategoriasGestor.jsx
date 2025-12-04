// src/pages/CategoriasGestor.jsx
import React, { useEffect, useMemo, useState } from "react";
import NavbarBlanco from "../components/NavbarBlanco";
import {
  Plus,
  Search,
  X,
  Trash2,
  RefreshCw,
  Loader2,
  Save,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
} from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";

const NAVBAR_OFFSET_REM = 5;
const CAPACIDADES = [4, 8, 16, 32, 64, 128, 256];

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
    if (i >= 0)
      return (
        JSON.parse(str.slice(i))?.mensaje ||
        JSON.parse(str.slice(i))?.error ||
        str
      );
    return str;
  } catch {
    return String(e?.message || e);
  }
};
const normalizeStr = (s = "") =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const strokeTitle = {
  color: "#fff",
  WebkitTextStroke: "1.2px rgba(16,16,16,1)",
  textShadow: "0 0 20px #000, 0 0 1px #000, 0 0 1px #000",
};
const strokeSmall = {
  color: "#fff",
  WebkitTextStroke: "0.25px #000",
  textShadow: "0 0 5px #000, 0 0 .5px #000, 0 0 .5px #000",
};

// Only accept Firestore's real id
const safeId = (c) => c?.id ?? null;

export default function CategoriasGestor() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");

  // create
  const [nombre, setNombre] = useState("");
  const [capacidad, setCapacidad] = useState(32);
  const [creating, setCreating] = useState(false);

  // inline edit state
  const [editing, setEditing] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editCapacidad, setEditCapacidad] = useState(32);
  const [savingRow, setSavingRow] = useState(false);

  // order
  const [localOrder, setLocalOrder] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchJSON("/categorias");
      const list = Array.isArray(data) ? data : [];
      list.forEach((c) => {
        c.capacidad = Number(c.capacidad);
        c.orden = Number(c.orden ?? 0);
      });
      list.sort(
        (a, b) =>
          a.orden - b.orden || (a?.nombre || "").localeCompare(b?.nombre || "")
      );
      setCategorias(list);
      const ids = list.map((c) => c.id).filter(Boolean);
      setLocalOrder(ids);
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e) {
    e?.preventDefault?.();
    const nm = nombre.trim();
    const cap = Number(capacidad);
    if (!nm) return setErr("El nombre es obligatorio.");
    if (!Number.isInteger(cap) || cap < 4)
      return setErr("La capacidad debe ser un entero ≥ 4.");
    setCreating(true);
    setErr("");
    try {
      await fetchJSON("/categorias", {
        method: "POST",
        body: JSON.stringify({ nombre: nm, capacidad: cap }),
      });
      setNombre("");
      setCapacidad(32);
      await loadAll();
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return setErr("No hay ID válido para eliminar.");
    const ok = window.confirm(
      "¿Eliminar la categoría? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    try {
      await fetchJSON(`/categorias/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadAll();
    } catch (e) {
      setErr(normalizeError(e));
    }
  }

  function moveUp(id) {
    setLocalOrder((arr) => {
      const i = arr.indexOf(id);
      if (i <= 0) return arr;
      const copy = arr.slice();
      [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
      return copy;
    });
  }
  function moveDown(id) {
    setLocalOrder((arr) => {
      const i = arr.indexOf(id);
      if (i < 0 || i === arr.length - 1) return arr;
      const copy = arr.slice();
      [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
      return copy;
    });
  }

async function saveOrder() {
  setSavingOrder(true);
  setErr("");
  try {
    const realIds = localOrder.filter(
      (id) => typeof id === "string" && id !== "orden" && id.trim() !== ""
    );

    if (realIds.length === 0) {
      throw new Error("No hay IDs válidos para guardar el orden.");
    }

    await fetchJSON("/categorias/orden", {
      method: "PATCH",
      body: JSON.stringify(realIds),
    });
    await loadAll();
  } catch (e) {
    setErr(normalizeError(e));
  } finally {
    setSavingOrder(false);
  }
}



  function startEdit(c) {
    const id = safeId(c);
    if (!id) return setErr("No hay ID válido para editar.");
    setEditing(id);
    setEditNombre(c?.nombre || "");
    setEditCapacidad(Number(c?.capacidad ?? 32));
  }
  async function saveEdit(id) {
    if (!id) return setErr("No hay ID válido para editar.");
    const nm = String(editNombre || "").trim();
    const cap = Number(editCapacidad);
    if (!nm) return setErr("El nombre es obligatorio.");
    if (!Number.isInteger(cap) || cap < 4)
      return setErr("La capacidad debe ser un entero ≥ 4.");
    setSavingRow(true);
    setErr("");
    try {
      await fetchJSON(`/categorias/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ nombre: nm, capacidad: cap }),
      });
      setEditing(null);
      await loadAll();
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setSavingRow(false);
    }
  }

  const q = normalizeStr(query);
  const listByOrder = useMemo(() => {
    const map = new Map(categorias.filter((c) => !!c.id).map((c) => [c.id, c]));
    const arr = localOrder.map((id) => map.get(id)).filter(Boolean);
    return q
      ? arr.filter((c) => normalizeStr(c?.nombre || "").includes(q))
      : arr;
  }, [categorias, localOrder, q]);

  return (
    <div className="relative min-h-screen w-full">
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <NavbarBlanco />

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
              Gestor de Categorías
            </h1>

            {/* Controls */}
            <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
              <div className="relative w-full max-w-sm ml-2">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
                  aria-hidden
                />
                <input
                  id="categoria-search"
                  type="text"
                  inputMode="search"
                  placeholder="Buscar categoría por nombre"
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

              {/* Create */}
              <form
                onSubmit={handleCreate}
                className="flex flex-row flex-wrap items-end gap-3 ml-2"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-white/80 text-sm text-left">
                    Nombre
                  </label>
                  <input
                    type="text"
                    placeholder='Ej: "Primera", "Intermedia", "4ta"'
                    className="w-56 h-11 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3 text-base placeholder-white/50 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white/80 text-sm text-left">
                    Capacidad (mín. 4)
                  </label>
                  <div className="relative">
                    <select
                      className="h-11 pl-3 pr-9 text-base rounded-lg border border-white/30 bg-neutral-900/80 text-white shadow-sm"
                      value={capacidad}
                      onChange={(e) => setCapacidad(Number(e.target.value))}
                    >
                      {CAPACIDADES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70">
                      ▾
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className={`h-11 px-4 rounded-lg border bg-cyan-700/90 text-white border-white ${
                    creating ? "opacity-60 cursor-wait" : "hover:bg-cyan-600/90"
                  }`}
                >
                  {creating ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Crear categoría
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={loadAll}
                  className="h-11 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20">
            <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <h2
                  className="text-xl sm:text-2xl font-bold"
                  style={strokeSmall}
                >
                  Categorías
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveOrder}
                    disabled={savingOrder}
                    className="h-10 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80"
                  >
                    {savingOrder ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar orden
                      </span>
                    )}
                  </button>

                  {(loading || err) && (
                    <div className="text-sm text-white/80" aria-live="polite">
                      {loading ? "Cargando datos…" : `Error: ${err}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="bg-neutral-800/80 text-base sm:text-lg">
                      <th className="px-6 py-4 font-semibold border-y border-white/20 w-28">
                        Orden
                      </th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">
                        Nombre
                      </th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">
                        Capacidad
                      </th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20 w-[20rem]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {!loading && listByOrder.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center border-t border-white/10 text-white/70"
                        >
                          No hay categorías.
                        </td>
                      </tr>
                    )}

                    {loading &&
                      [...Array(4)].map((_, i) => (
                        <tr
                          key={`sk-${i}`}
                          className={
                            i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                          }
                        >
                          {Array.from({ length: 4 }).map((__, j) => (
                            <td
                              key={`sk-${i}-${j}`}
                              className="px-6 py-4 border-t border-white/10"
                            >
                              <div className="h-5 w-full max-w-[16rem] animate-pulse rounded bg-white/10" />
                            </td>
                          ))}
                        </tr>
                      ))}

                    {!loading &&
                      listByOrder.map((c, i) => {
                        const id = safeId(c);
                        const idx = localOrder.indexOf(id);
                        const hasRealId = !!id;
                        const isEditing = editing === id;

                        return (
                          <tr
                            key={id}
                            className={`transition-colors hover:bg-neutral-800/60 ${
                              i % 2 === 0
                                ? "bg-neutral-900/40"
                                : "bg-transparent"
                            }`}
                          >
                            <td className="px-6 py-4 border-t border-white/10">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  className="h-8 w-8 grid place-items-center rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80 disabled:opacity-40"
                                  onClick={() => moveUp(id)}
                                  disabled={idx <= 0}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  className="h-8 w-8 grid place-items-center rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80 disabled:opacity-40"
                                  onClick={() => moveDown(id)}
                                  disabled={idx === localOrder.length - 1}
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <span className="ml-2 text-sm text-white/80">
                                  #{idx + 1}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 border-t border-white/10">
                              {isEditing ? (
                                <input
                                  className="h-9 w-full rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3 text-sm"
                                  value={editNombre}
                                  onChange={(e) =>
                                    setEditNombre(e.target.value)
                                  }
                                />
                              ) : (
                                c?.nombre || "—"
                              )}
                            </td>

                            <td className="px-6 py-4 border-t border-white/10">
                              {isEditing ? (
                                <select
                                  className="h-9 pl-3 pr-9 text-sm rounded-lg border border-white/30 bg-neutral-900/80 text-white"
                                  value={editCapacidad}
                                  onChange={(e) =>
                                    setEditCapacidad(Number(e.target.value))
                                  }
                                >
                                  {CAPACIDADES.map((n) => (
                                    <option key={n} value={n}>
                                      {n}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                c?.capacidad ?? "—"
                              )}
                            </td>

                            <td className="px-6 py-4 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                {!isEditing ? (
                                  <button
                                    className="h-9 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80"
                                    onClick={() => startEdit(c)}
                                    title="Editar"
                                    disabled={!hasRealId}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Edit3 className="w-4 h-4" />
                                      Editar
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    className="h-9 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80 disabled:opacity-60"
                                    disabled={savingRow}
                                    onClick={() => saveEdit(id)}
                                    title="Guardar"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      {savingRow ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                      Guardar
                                    </span>
                                  </button>
                                )}

                                <button
                                  className="h-9 px-3 rounded-lg border bg-red-600/90 text-white border-white hover:bg-red-500/90 disabled:opacity-60"
                                  onClick={() =>
                                    hasRealId ? handleDelete(id) : null
                                  }
                                  disabled={!hasRealId}
                                  title={
                                    hasRealId ? "Eliminar" : "ID no disponible"
                                  }
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 text-xs text-white/60 border-t border-white/10">
                Jerarquía: la primera es la mejor. Reordená con ↑/↓ y guardá con{" "}
                <b>Guardar orden</b>.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
