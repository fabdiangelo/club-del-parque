// src/pages/FiltrosGestor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import NavbarBlanco from "../components/NavbarBlanco";
import {
  Plus,
  Search,
  X,
  Trash2,
  RefreshCw,
  Loader2,
  Edit3,
  Check,
} from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";

/* ---------------- UI + helpers ---------------- */
const NAVBAR_OFFSET_REM = 5;
const DEFAULT_MODALIDADES = ["single", "doble"];
const DEFAULT_GENEROS = ["masculino", "femenino", "mixto"];
const DEFAULT_DEPORTES = [
  { id: "tenis", nombre: "Tenis" },
  { id: "padel", nombre: "Pádel" },
];
const DEFAULT_FILTROS = [
  { modalidad: "single", genero: "masculino" },
  { modalidad: "single", genero: "femenino" },
  { modalidad: "doble", genero: "masculino" },
  { modalidad: "doble", genero: "femenino" },
  { modalidad: "doble", genero: "mixto" },
];

// Sólo se puede borrar lo recién creado (ventana corta)
const DELETE_GRACE_MS = 2 * 60 * 1000; // 2 minutos

// Advertencia global antes de crear cualquier cosa
const CREATE_WARNING =
  "⚠️ Aviso: si salís de esta página después de crear, no vas a poder borrar desde aquí.\n\n¿Querés continuar?";
const confirmCreate = () => window.confirm(CREATE_WARNING);

const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);
const fetchJSON = async (path, opts = {}) => {
  const res = await fetch(toApi(path), {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    cache: "no-store",
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
};
const normalizeError = (e) => {
  try {
    const str = String(e?.message || e);
    const i = str.indexOf("{");
    if (i >= 0) {
      const j = JSON.parse(str.slice(i));
      return j?.mensaje || j?.error || str;
    }
    return str;
  } catch {
    return String(e?.message || e);
  }
};
const normalizeStr = (s = "") =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

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

const slugOk = (s) => /^[a-z0-9-]{2,40}$/.test(s || "");

/* ---------------- Page ---------------- */
export default function FiltrosGestor() {
  // Modalidades
  const [modalidades, setModalidades] = useState([]);
  const [modNombre, setModNombre] = useState("");
  const [modQuery, setModQuery] = useState("");
  const [modLoading, setModLoading] = useState(true);

  // Géneros
  const [generos, setGeneros] = useState([]);
  const [genNombre, setGenNombre] = useState("");
  const [genQuery, setGenQuery] = useState("");
  const [genLoading, setGenLoading] = useState(true);

  // Deportes
  const [deportes, setDeportes] = useState([]);
  const [depNombre, setDepNombre] = useState("");
  const [depId, setDepId] = useState("");
  const [depQuery, setDepQuery] = useState("");
  const [depLoading, setDepLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState([]);
  const [fLoading, setFLoading] = useState(true);
  const [fErr, setFErr] = useState("");

  // Crear filtro
  const [fNew, setFNew] = useState({
    modalidad: "",
    genero: "",
    edadMin: "",
    edadMax: "",
    pesoMin: "",
    pesoMax: "",
  });
  const [creatingFiltro, setCreatingFiltro] = useState(false);

  // Edit inline filtros
  const [editId, setEditId] = useState(null);
  const [fEdit, setFEdit] = useState({
    modalidad: "",
    genero: "",
    edadMin: "",
    edadMax: "",
    pesoMin: "",
    pesoMax: "",
  });
  const [savingFiltro, setSavingFiltro] = useState(false);

  const [globalErr, setGlobalErr] = useState("");
  const [precargando, setPrecargando] = useState(false);

  // Track “recién creado” para permitir borrar sólo en ventana corta
  const createdRef = useRef({
    modalidades: new Map(), // key: nombre
    generos: new Map(), // key: nombre
    deportes: new Map(), // key: id
    filtros: new Map(), // key: id
  });
  const [, forceTick] = useState(0);
  const markCreated = (type, key) => {
    if (!key) return;
    createdRef.current[type].set(String(key), Date.now());
    forceTick((t) => t + 1);
    setTimeout(() => {
      if (createdRef.current[type].get(String(key))) {
        createdRef.current[type].delete(String(key));
        forceTick((t) => t + 1);
      }
    }, DELETE_GRACE_MS + 250);
  };
  const canDelete = (type, key) => {
    const ts = createdRef.current[type].get(String(key));
    return !!ts && Date.now() - ts <= DELETE_GRACE_MS;
  };
  const denyDeleteMessage =
    "No podés eliminar este ítem desde aquí. Solo se permite borrar inmediatamente después de crearlo.";

  /* ---- Loaders ---- */
  async function loadModalidades() {
    setModLoading(true);
    try {
      const data = await fetchJSON("/modalidades");
      const list = Array.isArray(data) ? data : [];
      setModalidades(list);
      if (!modNombre && list.length) setModNombre(list[0]?.nombre || "");
      if (!fNew.modalidad && list.length)
        setFNew((s) => ({ ...s, modalidad: list[0]?.nombre || "" }));
    } catch (e) {
      setGlobalErr((p) => p || normalizeError(e));
    } finally {
      setModLoading(false);
    }
  }
  async function loadGeneros() {
    setGenLoading(true);
    try {
      const data = await fetchJSON("/generos");
      const list = Array.isArray(data) ? data : [];
      setGeneros(list);
      if (!genNombre && list.length) setGenNombre(list[0]?.nombre || "");
      if (!fNew.genero && list.length)
        setFNew((s) => ({ ...s, genero: list[0]?.nombre || "" }));
    } catch (e) {
      setGlobalErr((p) => p || normalizeError(e));
    } finally {
      setGenLoading(false);
    }
  }
  async function loadDeportes() {
    setDepLoading(true);
    try {
      const data = await fetchJSON("/deportes");
      setDeportes(Array.isArray(data) ? data : []);
    } catch (e) {
      setGlobalErr((p) => p || normalizeError(e));
    } finally {
      setDepLoading(false);
    }
  }
  async function loadFiltros() {
    setFLoading(true);
    setFErr("");
    try {
      const data = await fetchJSON("/filtros");
      setFiltros(Array.isArray(data) ? data : []);
    } catch (e) {
      setFErr(normalizeError(e));
    } finally {
      setFLoading(false);
    }
  }

  useEffect(() => {
    loadModalidades();
    loadGeneros();
    loadDeportes();
    loadFiltros();
  }, []);

  /* ---------------- Precarga ---------------- */
  async function safePost(path, body) {
    try {
      await fetchJSON(path, { method: "POST", body: JSON.stringify(body) });
    } catch (e) {
      const msg = normalizeError(e);
      if (/existe|ya existe|duplicad/i.test(msg)) return;
      throw e;
    }
  }
  async function ensureDefaultFiltros() {
    const existing = await fetchJSON("/filtros");
    const have = new Set(
      (existing || []).map(
        (f) =>
          `${(f?.modalidad?.nombre || "").toLowerCase()}|${(
            f?.genero?.nombre || ""
          ).toLowerCase()}|${f?.edadMin ?? ""}|${f?.edadMax ?? ""}|${
            f?.pesoMin ?? ""
          }|${f?.pesoMax ?? ""}`
      )
    );
    for (const base of DEFAULT_FILTROS) {
      const key = `${base.modalidad}|${base.genero}||||`;
      if (!have.has(key)) {
        await safePost("/filtros", {
          modalidad: base.modalidad,
          genero: base.genero,
          edadMin: null,
          edadMax: null,
          pesoMin: null,
          pesoMax: null,
        });
        // Lo creado por precarga NO se marca como deletable
      }
    }
  }
  async function precargar() {
    const ok = window.confirm(
      "¿Cargar valores por defecto en la base? (modalidades, géneros, deportes y filtros)\n\n" +
        "⚠️ Además: si salís de esta página después de crear, no vas a poder borrar desde aquí."
    );
    if (!ok) return;

    setPrecargando(true);
    setGlobalErr("");
    try {
      for (const m of DEFAULT_MODALIDADES) {
        await safePost("/modalidades", { nombre: m });
      }
      for (const g of DEFAULT_GENEROS) {
        await safePost("/generos", { nombre: g });
      }
      for (const d of DEFAULT_DEPORTES) {
        await safePost("/deportes", d);
      }
      await ensureDefaultFiltros();
      await Promise.all([
        loadModalidades(),
        loadGeneros(),
        loadDeportes(),
        loadFiltros(),
      ]);
    } catch (e) {
      setGlobalErr(normalizeError(e));
    } finally {
      setPrecargando(false);
    }
  }

  /* ---- Crear / Editar / Borrar ---- */
  async function crearModalidad(e) {
    e?.preventDefault?.();
    const nombre = String(modNombre || "").trim().toLowerCase();
    if (!nombre) return setGlobalErr("Completá el nombre de la modalidad.");
    if (!confirmCreate()) return;
    try {
      await fetchJSON("/modalidades", {
        method: "POST",
        body: JSON.stringify({ nombre }),
      });
      markCreated("modalidades", nombre);
      setModNombre("");
      await loadModalidades();
    } catch (e) {
      setGlobalErr(normalizeError(e));
    }
  }
  async function eliminarModalidad(nombre) {
    if (!canDelete("modalidades", nombre)) {
      setGlobalErr(denyDeleteMessage);
      return;
    }
    const ok = window.confirm(`Eliminar modalidad "${nombre}"?`);
    if (!ok) return;
    try {
      await fetchJSON(`/modalidades/${encodeURIComponent(nombre)}`, {
        method: "DELETE",
      });
      createdRef.current.modalidades.delete(String(nombre));
      await loadModalidades();
      await loadFiltros();
    } catch (e) {
      setGlobalErr(normalizeError(e));
    }
  }

  async function crearGenero(e) {
    e?.preventDefault?.();
    const nombre = String(genNombre || "").trim().toLowerCase();
    if (!nombre) return setGlobalErr("Completá el nombre del género.");
    if (!confirmCreate()) return;
    try {
      await fetchJSON("/generos", {
        method: "POST",
        body: JSON.stringify({ nombre }),
      });
      markCreated("generos", nombre);
      setGenNombre("");
      await loadGeneros();
    } catch (e) {
      setGlobalErr(normalizeError(e));
    }
  }
  async function eliminarGenero(nombre) {
    if (!canDelete("generos", nombre)) {
      setGlobalErr(denyDeleteMessage);
      return;
    }
    const ok = window.confirm(`Eliminar género "${nombre}"?`);
    if (!ok) return;
    try {
      await fetchJSON(`/generos/${encodeURIComponent(nombre)}`, {
        method: "DELETE",
      });
      createdRef.current.generos.delete(String(nombre));
      await loadGeneros();
      await loadFiltros();
    } catch (e) {
      setGlobalErr(normalizeError(e));
    }
  }

  async function crearDeporte(e) {
    e?.preventDefault?.();
    const id = String(depId || "").trim().toLowerCase();
    const nombre = String(depNombre || "").trim();
    if (!id || !nombre)
      return setGlobalErr("Completá ID y Nombre del deporte.");
    if (!slugOk(id))
      return setGlobalErr("ID inválido (slug: a-z, 0-9, guión).");
    if (!confirmCreate()) return;
    try {
      await fetchJSON("/deportes", {
        method: "POST",
        body: JSON.stringify({ id, nombre }),
      });
      markCreated("deportes", id);
      setDepId("");
      setDepNombre("");
      await loadDeportes();
    } catch (e) {
      setGlobalErr(normalizeError(e));
    }
  }
  async function eliminarDeporte(id) {
    if (!canDelete("deportes", id)) {
      setGlobalErr(denyDeleteMessage);
      return;
    }
    const ok = window.confirm(`Eliminar deporte "${id}"?`);
    if (!ok) return;
    try {
      await fetchJSON(`/deportes/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      createdRef.current.deportes.delete(String(id));
      await loadDeportes();
      await loadFiltros();
    } catch (e) {
      setGlobalErr(normalizeError(e));
    }
  }

  async function crearFiltro(e) {
    e?.preventDefault?.();
    if (!modalidades.length || !generos.length)
      return setFErr("Cargá Modalidades y Géneros primero.");
    if (!fNew.modalidad || !fNew.genero)
      return setFErr("Elegí modalidad y género.");

    if (!confirmCreate()) return;

    setCreatingFiltro(true);
    try {
      const body = {
        modalidad: fNew.modalidad,
        genero: fNew.genero,
        edadMin: fNew.edadMin !== "" ? Number(fNew.edadMin) : null,
        edadMax: fNew.edadMax !== "" ? Number(fNew.edadMax) : null,
        pesoMin: fNew.pesoMin !== "" ? Number(fNew.pesoMin) : null,
        pesoMax: fNew.pesoMax !== "" ? Number(fNew.pesoMax) : null,
      };
      const created = await fetchJSON("/filtros", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (created?.id) markCreated("filtros", created.id);

      setFNew({
        modalidad: modalidades[0]?.nombre || "",
        genero: generos[0]?.nombre || "",
        edadMin: "",
        edadMax: "",
        pesoMin: "",
        pesoMax: "",
      });
      await loadFiltros();
    } catch (e) {
      setFErr(normalizeError(e));
    } finally {
      setCreatingFiltro(false);
    }
  }
  function startEditFiltro(row) {
    setEditId(row.id);
    setFEdit({
      modalidad: row?.modalidad?.nombre || modalidades[0]?.nombre || "",
      genero: row?.genero?.nombre || generos[0]?.nombre || "",
      edadMin: row?.edadMin ?? "",
      edadMax: row?.edadMax ?? "",
      pesoMin: row?.pesoMin ?? "",
      pesoMax: row?.pesoMax ?? "",
    });
  }
  async function saveEditFiltro() {
    if (!editId) return;
    setSavingFiltro(true);
    try {
      const body = {
        modalidad: fEdit.modalidad,
        genero: fEdit.genero,
        edadMin: fEdit.edadMin !== "" ? Number(fEdit.edadMin) : null,
        edadMax: fEdit.edadMax !== "" ? Number(fEdit.edadMax) : null,
        pesoMin: fEdit.pesoMin !== "" ? Number(fEdit.pesoMin) : null,
        pesoMax: fEdit.pesoMax !== "" ? Number(fEdit.pesoMax) : null,
      };
      await fetchJSON(`/filtros/${encodeURIComponent(editId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setEditId(null);
      await loadFiltros();
    } catch (e) {
      setFErr(normalizeError(e));
    } finally {
      setSavingFiltro(false);
    }
  }
  async function eliminarFiltro(id) {
    if (!canDelete("filtros", id)) {
      setFErr(denyDeleteMessage);
      return;
    }
    const ok = window.confirm("¿Eliminar filtro?");
    if (!ok) return;
    try {
      await fetchJSON(`/filtros/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      createdRef.current.filtros.delete(String(id));
      await loadFiltros();
    } catch (e) {
      setFErr(normalizeError(e));
    }
  }

  /* ---- Filters UI filtering ---- */
  const modFiltered = useMemo(() => {
    const q = normalizeStr(modQuery);
    const list = Array.isArray(modalidades) ? modalidades : [];
    if (!q) return list;
    return list.filter((m) => normalizeStr(m?.nombre || "").includes(q));
  }, [modalidades, modQuery]);

  const genFiltered = useMemo(() => {
    const q = normalizeStr(genQuery);
    const list = Array.isArray(generos) ? generos : [];
    if (!q) return list;
    return list.filter((g) => normalizeStr(g?.nombre || "").includes(q));
  }, [generos, genQuery]);

  const depFiltered = useMemo(() => {
    const q = normalizeStr(depQuery);
    const list = Array.isArray(deportes) ? deportes : [];
    if (!q) return list;
    return list.filter(
      (d) =>
        normalizeStr(d?.id || "").includes(q) ||
        normalizeStr(d?.nombre || "").includes(q)
    );
  }, [deportes, depQuery]);

  // Helpers para títulos de los botones delete
  const delTitle = (enabled) =>
    enabled
      ? "Eliminar (disponible por poco tiempo tras crear)"
      : "No se puede eliminar (solo inmediato tras creación)";

  // Mostrar botón de Precarga sólo cuando TODO está vacío y ya cargó
  const ready =
    !modLoading && !genLoading && !depLoading && !fLoading;
  const hasAnyData =
    (modalidades?.length || 0) > 0 ||
    (generos?.length || 0) > 0 ||
    (deportes?.length || 0) > 0 ||
    (filtros?.length || 0) > 0;
  const showPrecarga = ready && !hasAnyData;

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
              Gestor de Filtros
            </h1>

            {!!globalErr && (
              <p className="mt-4 text-sm text-red-300">{String(globalErr)}</p>
            )}

            {/* Botón Precarga: sólo si TODO está vacío */}
            {showPrecarga && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={precargar}
                  disabled={precargando}
                  className={`h-10 px-4 rounded-lg border border-white/40 text-white ${
                    precargando
                      ? "bg-emerald-700/60 cursor-wait"
                      : "bg-emerald-700/90 hover:bg-emerald-600/90"
                  }`}
                  title="Precargar valores por defecto (modalidades, géneros, deportes y filtros)"
                >
                  <span className="inline-flex items-center gap-2">
                    {precargando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Precarga
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20 space-y-10">
            {/* ---- Modalidades ---- */}
            <SectionCard
              title="Modalidades"
              loading={modLoading}
              right={<Refresh onClick={loadModalidades} />}
            >
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="search"
                    placeholder="Buscar modalidad"
                    className="w-full h-11 rounded-lg border border-white/30 bg-neutral-900/80 text-white pl-9 pr-10"
                    value={modQuery}
                    onChange={(e) => setModQuery(e.target.value)}
                  />
                  {modQuery && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
                      onClick={() => setModQuery("")}
                    >
                      <X className="w-5 h-5 text-white/70" />
                    </button>
                  )}
                </div>

                <form onSubmit={crearModalidad} className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-sm text-left">
                      Nueva modalidad
                    </label>
                    <input
                      className="h-11 w-56 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3"
                      placeholder='Ej: "single", "doble"'
                      value={modNombre}
                      onChange={(e) => setModNombre(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-lg border bg-cyan-700/90 text-white border-white hover:bg-cyan-600/90"
                    disabled={!modNombre.trim()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Agregar
                    </span>
                  </button>
                </form>
              </div>

              <Table
                cols={["Nombre", "Acciones"]}
                rows={modFiltered.map((m) => {
                  const deletable = canDelete("modalidades", m?.nombre);
                  return {
                    key: m?.nombre || cryptoKey(),
                    cells: [
                      m?.nombre || "—",
                      <DeleteBtn
                        key={`del-${m?.nombre}`}
                        label="Eliminar"
                        onClick={() => eliminarModalidad(m?.nombre)}
                        disabled={!deletable}
                        title={delTitle(deletable)}
                      />,
                    ],
                  };
                })}
                empty="No hay modalidades."
              />
            </SectionCard>

            {/* ---- Géneros ---- */}
            <SectionCard
              title="Géneros"
              loading={genLoading}
              right={<Refresh onClick={loadGeneros} />}
            >
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="search"
                    placeholder="Buscar género"
                    className="w-full h-11 rounded-lg border border-white/30 bg-neutral-900/80 text-white pl-9 pr-10"
                    value={genQuery}
                    onChange={(e) => setGenQuery(e.target.value)}
                  />
                  {genQuery && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
                      onClick={() => setGenQuery("")}
                    >
                      <X className="w-5 h-5 text-white/70" />
                    </button>
                  )}
                </div>

                <form onSubmit={crearGenero} className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-sm text-left">
                      Nuevo género
                    </label>
                    <input
                      className="h-11 w-56 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3"
                      placeholder='Ej: "masculino", "femenino", "mixto"'
                      value={genNombre}
                      onChange={(e) => setGenNombre(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-lg border bg-cyan-700/90 text-white border-white hover:bg-cyan-600/90"
                    disabled={!genNombre.trim()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Agregar
                    </span>
                  </button>
                </form>
              </div>

              <Table
                cols={["Nombre", "Acciones"]}
                rows={genFiltered.map((g) => {
                  const deletable = canDelete("generos", g?.nombre);
                  return {
                    key: g?.nombre || cryptoKey(),
                    cells: [
                      g?.nombre || "—",
                      <DeleteBtn
                        key={`del-${g?.nombre}`}
                        label="Eliminar"
                        onClick={() => eliminarGenero(g?.nombre)}
                        disabled={!deletable}
                        title={delTitle(deletable)}
                      />,
                    ],
                  };
                })}
                empty="No hay géneros."
              />
            </SectionCard>

            {/* ---- Deportes ---- */}
            <SectionCard
              title="Deportes"
              loading={depLoading}
              right={<Refresh onClick={loadDeportes} />}
            >
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="search"
                    placeholder="Buscar deporte"
                    className="w-full h-11 rounded-lg border border-white/30 bg-neutral-900/80 text-white pl-9 pr-10"
                    value={depQuery}
                    onChange={(e) => setDepQuery(e.target.value)}
                  />
                  {depQuery && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
                      onClick={() => setDepQuery("")}
                    >
                      <X className="w-5 h-5 text-white/70" />
                    </button>
                  )}
                </div>

                <form onSubmit={crearDeporte} className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-sm text-left">
                      ID (slug)
                    </label>
                    <input
                      className="h-11 w-40 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3"
                      placeholder="tenis"
                      value={depId}
                      onChange={(e) => setDepId(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-white/80 text-sm text-left">
                      Nombre
                    </label>
                    <input
                      className="h-11 w-56 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3"
                      placeholder="Tenis"
                      value={depNombre}
                      onChange={(e) => setDepNombre(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-lg border bg-cyan-700/90 text-white border-white hover:bg-cyan-600/90"
                    disabled={!depId.trim() || !depNombre.trim() || !slugOk(depId)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Agregar
                    </span>
                  </button>
                </form>
              </div>

              <Table
                cols={["ID", "Nombre", "Acciones"]}
                rows={depFiltered.map((d) => {
                  const deletable = canDelete("deportes", d?.id);
                  return {
                    key: d?.id || cryptoKey(),
                    cells: [
                      d?.id || "—",
                      d?.nombre || "—",
                      <DeleteBtn
                        key={`dep-del-${d?.id}`}
                        label="Eliminar"
                        onClick={() => eliminarDeporte(d?.id)}
                        disabled={!deletable}
                        title={delTitle(deletable)}
                      />,
                    ],
                  };
                })}
                empty="No hay deportes."
              />
            </SectionCard>

            {/* ---- Filtros ---- */}
            <SectionCard
              title="Filtros"
              loading={fLoading}
              right={<Refresh onClick={loadFiltros} />}
            >
              {!!fErr && (
                <div className="mb-2 text-sm text-red-300">{String(fErr)}</div>
              )}

              <form
                onSubmit={crearFiltro}
                className="flex flex-wrap items-end gap-3 mb-4"
              >
                <SelectLabeled
                  label="Modalidad"
                  value={fNew.modalidad}
                  onChange={(v) => setFNew((s) => ({ ...s, modalidad: v }))}
                  options={(modalidades || [])
                    .map((m) => m?.nombre)
                    .filter(Boolean)}
                  disabled={!modalidades.length}
                />
                <SelectLabeled
                  label="Género"
                  value={fNew.genero}
                  onChange={(v) => setFNew((s) => ({ ...s, genero: v }))}
                  options={(generos || [])
                    .map((g) => g?.nombre)
                    .filter(Boolean)}
                  disabled={!generos.length}
                />
                <NumberLabeled
                  label="Edad min"
                  value={fNew.edadMin}
                  onChange={(n) => setFNew((s) => ({ ...s, edadMin: n }))}
                />
                <NumberLabeled
                  label="Edad max"
                  value={fNew.edadMax}
                  onChange={(n) => setFNew((s) => ({ ...s, edadMax: n }))}
                />
                <NumberLabeled
                  label="Peso min"
                  value={fNew.pesoMin}
                  onChange={(n) => setFNew((s) => ({ ...s, pesoMin: n }))}
                />
                <NumberLabeled
                  label="Peso max"
                  value={fNew.pesoMax}
                  onChange={(n) => setFNew((s) => ({ ...s, pesoMax: n }))}
                />

                <button
                  type="submit"
                  disabled={
                    creatingFiltro ||
                    !modalidades.length ||
                    !generos.length ||
                    !fNew.modalidad ||
                    !fNew.genero
                  }
                  className={`h-11 px-4 rounded-lg border bg-cyan-700/90 text-white border-white ${
                    creatingFiltro ? "opacity-60 cursor-wait" : "hover:bg-cyan-600/90"
                  }`}
                >
                  {creatingFiltro ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Crear filtro
                    </span>
                  )}
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="bg-neutral-800/80 text-base sm:text-lg">
                      <Th>Modalidad</Th>
                      <Th>Género</Th>
                      <Th>Edad</Th>
                      <Th>Peso</Th>
                      <Th className="w-[20rem]">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {fLoading ? (
                      [...Array(4)].map((_, i) => (
                        <tr
                          key={`sk-f-${i}`}
                          className={i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"}
                        >
                          {Array.from({ length: 5 }).map((__, j) => (
                            <td
                              key={`sk-f-${i}-${j}`}
                              className="px-6 py-4 border-t border-white/10"
                            >
                              <div className="h-5 w-full max-w-[16rem] animate-pulse rounded bg-white/10" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtros.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center border-t border-white/10 text-white/70"
                        >
                          No hay filtros cargados.
                        </td>
                      </tr>
                    ) : (
                      filtros.map((row, i) => {
                        const isEditing = editId === row.id;
                        const edadTxt =
                          (row?.edadMin ?? null) !== null ||
                          (row?.edadMax ?? null) !== null
                            ? `${row?.edadMin ?? "-"} - ${row?.edadMax ?? "-"}`
                            : "—";
                        const pesoTxt =
                          (row?.pesoMin ?? null) !== null ||
                          (row?.pesoMax ?? null) !== null
                            ? `${row?.pesoMin ?? "-"} - ${row?.pesoMax ?? "-"}`
                            : "—";
                        const deletable = canDelete("filtros", row.id);

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors hover:bg-neutral-800/60 ${
                              i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                            }`}
                          >
                            {/* Modalidad */}
                            <td className="px-6 py-4 border-t border-white/10">
                              {isEditing ? (
                                <select
                                  className="h-9 pl-3 pr-9 text-sm rounded-lg border border-white/30 bg-neutral-900/80 text-white"
                                  value={fEdit.modalidad}
                                  onChange={(e) =>
                                    setFEdit((s) => ({
                                      ...s,
                                      modalidad: e.target.value,
                                    }))
                                  }
                                  disabled={!modalidades.length}
                                >
                                  {(modalidades || []).map((m) => (
                                    <option key={m?.nombre} value={m?.nombre}>
                                      {m?.nombre}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                row?.modalidad?.nombre || "—"
                              )}
                            </td>

                            {/* Género */}
                            <td className="px-6 py-4 border-t border-white/10">
                              {isEditing ? (
                                <select
                                  className="h-9 pl-3 pr-9 text-sm rounded-lg border border-white/30 bg-neutral-900/80 text-white"
                                  value={fEdit.genero}
                                  onChange={(e) =>
                                    setFEdit((s) => ({
                                      ...s,
                                      genero: e.target.value,
                                    }))
                                  }
                                  disabled={!generos.length}
                                >
                                  {(generos || []).map((g) => (
                                    <option key={g?.nombre} value={g?.nombre}>
                                      {g?.nombre}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                row?.genero?.nombre || "—"
                              )}
                            </td>

                            {/* Edad */}
                            <td className="px-6 py-4 border-t border-white/10">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    className="h-9 w-20 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-2 text-sm"
                                    type="number"
                                    placeholder="min"
                                    value={fEdit.edadMin ?? ""}
                                    onChange={(e) =>
                                      setFEdit((s) => ({
                                        ...s,
                                        edadMin:
                                          e.target.value === "" ? "" : Number(e.target.value),
                                      }))
                                    }
                                  />
                                  <span>—</span>
                                  <input
                                    className="h-9 w-20 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-2 text-sm"
                                    type="number"
                                    placeholder="max"
                                    value={fEdit.edadMax ?? ""}
                                    onChange={(e) =>
                                      setFEdit((s) => ({
                                        ...s,
                                        edadMax:
                                          e.target.value === "" ? "" : Number(e.target.value),
                                      }))
                                    }
                                  />
                                </div>
                              ) : (
                                edadTxt
                              )}
                            </td>

                            {/* Peso */}
                            <td className="px-6 py-4 border-t border-white/10">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    className="h-9 w-20 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-2 text-sm"
                                    type="number"
                                    placeholder="min"
                                    value={fEdit.pesoMin ?? ""}
                                    onChange={(e) =>
                                      setFEdit((s) => ({
                                        ...s,
                                        pesoMin:
                                          e.target.value === "" ? "" : Number(e.target.value),
                                      }))
                                    }
                                  />
                                  <span>—</span>
                                  <input
                                    className="h-9 w-20 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-2 text-sm"
                                    type="number"
                                    placeholder="max"
                                    value={fEdit.pesoMax ?? ""}
                                    onChange={(e) =>
                                      setFEdit((s) => ({
                                        ...s,
                                        pesoMax:
                                          e.target.value === "" ? "" : Number(e.target.value),
                                      }))
                                    }
                                  />
                                </div>
                              ) : (
                                pesoTxt
                              )}
                            </td>

                            {/* Acciones */}
                            <td className="px-6 py-4 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      className={`h-9 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80 disabled:opacity-60`}
                                      disabled={savingFiltro}
                                      onClick={saveEditFiltro}
                                      title="Guardar cambios"
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        {savingFiltro ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Check className="w-4 h-4" />
                                        )}
                                        Guardar
                                      </span>
                                    </button>

                                    <button
                                      className="h-9 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80"
                                      onClick={() => setEditId(null)}
                                      title="Cancelar edición"
                                      type="button"
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <X className="w-4 h-4" />
                                        Cancelar
                                      </span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="h-9 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80"
                                    onClick={() => startEditFiltro(row)}
                                    title="Editar filtro"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Edit3 className="w-4 h-4" />
                                      Editar
                                    </span>
                                  </button>
                                )}

                                <DeleteBtn
                                  label="Eliminar"
                                  onClick={() => eliminarFiltro(row.id)}
                                  disabled={!deletable}
                                  title={delTitle(deletable)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 text-xs text-white/60 border-t border-white/10">
                Administrá todas las opciones: Modalidad, Género, Deportes y Filtros combinados.
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Small UI helpers ---------------- */
function SectionCard({ title, loading, right, children }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <h2 className="text-xl sm:text-2xl font-bold" style={strokeSmall}>
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {right}
          {loading && (
            <div className="text-sm text-white/80" aria-live="polite">
              Cargando…
            </div>
          )}
        </div>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function Table({ cols, rows, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-white">
        <thead>
          <tr className="bg-neutral-800/80 text-base sm:text-lg">
            {cols.map((c, i) => (
              <Th key={i}>{c}</Th>
            ))}
          </tr>
        </thead>
        <tbody className="text-base sm:text-lg">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={cols.length}
                className="px-6 py-12 text-center border-t border-white/10 text-white/70"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={r.key || i}
                className={`transition-colors hover:bg-neutral-800/60 ${
                  i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                }`}
              >
                {r.cells.map((cell, j) => (
                  <td key={`${r.key ?? i}-${j}`} className="px-6 py-4 border-t border-white/10">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }) {
  return (
    <th className={`px-6 py-4 font-semibold border-y border-white/20 ${className || ""}`}>
      {children}
    </th>
  );
}

function DeleteBtn({ onClick, label = "Eliminar", disabled = false, title }) {
  return (
    <button
      className={`h-9 px-3 rounded-lg border ${
        disabled ? "bg-red-600/40 cursor-not-allowed" : "bg-red-600/90 hover:bg-red-500/90"
      } text-white border-white disabled:opacity-60`}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      type="button"
    >
      <span className="inline-flex items-center gap-2">
        <Trash2 className="w-4 h-4" />
        {label}
      </span>
    </button>
  );
}

function Refresh({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 px-3 rounded-lg border border-white/40 bg-neutral-900/80 text-white hover:bg-neutral-800/80"
      title="Refrescar"
    >
      <span className="inline-flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Refrescar
      </span>
    </button>
  );
}

function SelectLabeled({ label, value, onChange, options = [], disabled = false }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white/80 text-sm text-left">{label}</label>
      <div className="relative">
        <select
          className="h-11 pl-3 pr-9 text-base rounded-lg border border-white/30 bg-neutral-900/80 text-white shadow-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || options.length === 0}
        >
          {options.length === 0 ? (
            <option value="">(cargando…)</option>
          ) : (
            options.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))
          )}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70">
          ▾
        </span>
      </div>
    </div>
  );
}

function NumberLabeled({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white/80 text-sm text-left">{label}</label>
      <input
        type="number"
        className="h-11 w-28 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3"
        value={value}
        placeholder="—"
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onChange("");
          else onChange(Number(v));
        }}
      />
    </div>
  );
}

function cryptoKey() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
