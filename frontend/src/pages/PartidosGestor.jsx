// src/pages/PartidosGestor.jsx
import React, { useEffect, useMemo, useState} from "react";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import bgImg from "../assets/RankingsBackground.png";
import { PlayerPickerModal } from "../components/PlayerPickerModal";

/* ------------------------- Helpers ------------------------- */
const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);

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

const pad = (n) => String(n).padStart(2, "0");
const toLocalInputValue = (d) => {
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const day = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};
const toISOFromLocal = (localValue) => {
  if (!localValue) return new Date().toISOString();
  const d = new Date(localValue);
  return d.toISOString();
};
const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return iso;
  }
};

const emptyPartido = {
  id: undefined,
  timestamp: new Date().toISOString(),
  estado: "programado", // programado | en_juego | finalizado
  tipoPartido: "singles", // singles | dobles
  temporadaID: "",
  canchaID: "",
  etapa: "",
  jugadores: [],
  equipoLocal: [],
  equipoVisitante: [],
  ganadores: [],
  resultado: "",
};

/* ----------------------------- Página principal ----------------------------- */
export default function PartidosGestor() {
  // UI
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showWinners, setShowWinners] = useState(false);

  // Datos
  const [temporadas, setTemporadas] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [federados, setFederados] = useState([]);
  const [partidos, setPartidos] = useState([]);
const [toast, setToast] = useState(""); 
  // Selección
  const [selected, setSelected] = useState(() => new Set());

  const [loading, setLoading] = useState(true);
  const [, setErr] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      setErr("");
      try {
        const [ts, cs, fs, ps] = await Promise.all([
          fetchJSON("/temporadas"),
          fetchJSON("/canchas"),
          fetchJSON("/usuarios/federados"),
          fetchJSON("/partidos"),
        ]);
        if (cancelled) return;
        setTemporadas(ts || []);
        setCanchas(cs || []);
        setFederados(fs || []);
        setPartidos(Array.isArray(ps) ? ps : []);
      } catch (e) {
        if (!cancelled) setErr(normalizeError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = (filter || "").toLowerCase();
    if (!q) return partidos;
    return partidos.filter((p) =>
      [
        p.tipoPartido,
        p.etapa,
        p.estado,
        p.resultado,
        formatDateTime(p.timestamp),
        lookupName(temporadas, p.temporadaID),
        lookupName(canchas, p.canchaID),
        ...getPersons(p.jugadores, federados).map((x) => x.label),
        ...getPersons(p.ganadores || [], federados).map((x) => x.label),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [filter, partidos, temporadas, canchas, federados]);

  const onCreate = () => {
    setEditing({ ...emptyPartido });
    setShowForm(true);
  };

  const onEditSelected = () => {
    const [only] = Array.from(selected);
    const p = partidos.find((x) => x.id === only);
    if (p) {
      setEditing({ ...p });
      setShowForm(true);
    }
  };

  const onOpenWinners = () => {
    const [only] = Array.from(selected);
    const p = partidos.find((x) => x.id === only);
    if (p) setShowWinners(true);
  };

  const onDeleteSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(`¿Eliminar ${ids.length} partido(s)? Esta acción no se puede deshacer.`))
      return;
    try {
      setLoading(true);
      setErr("");
      await Promise.all(ids.map((id) => fetchJSON(`/partidos/${id}`, { method: "DELETE" })));
await reloadPartidos();   
setSelected(new Set());
setToast("Partido(s) eliminado(s).");
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setLoading(false);
    }
  };

const onSave = async (draft) => {
  const errs = validatePartido(draft);
  if (errs.length) { setToast(errs.join("\n")); return; }

  const payload = sanitizePayload(draft);
  const isEdit = Boolean(draft.id);

  try {
    setLoading(true);
    setErr("");
    if (isEdit) {
      await fetchJSON(`/partidos/${draft.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await fetchJSON(`/partidos`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    await reloadPartidos();      // ← always reload list
    setShowForm(false);
    setEditing(null);
    setToast(isEdit ? "Partido actualizado." : "Partido creado.");
  } catch (e) {
    setToast(normalizeError(e));
  } finally {
    setLoading(false);
  }
};



const onSaveWinners = async (ids) => {
  const [only] = Array.from(selected);
  const p = partidos.find((x) => x.id === only);
  if (!p) return;

  const payload = { ganadores: ids.filter((id) => (p.jugadores || []).includes(id)) };

  try {
    setLoading(true);
    setErr("");
    await fetchJSON(`/partidos/${p.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await reloadPartidos();   // ← just reload the list
    setShowWinners(false);
    setToast("Ganadores actualizados.");
  } catch (e) {
    setToast(normalizeError(e));
  } finally {
    setLoading(false);
  }
};

  const reloadPartidos = async () => {
  try {
    setLoading(true);
    setErr("");
    const ps = await fetchJSON("/partidos");
    setPartidos(Array.isArray(ps) ? ps : []);
  } catch (e) {
    setToast(normalizeError(e));
  } finally {
    setLoading(false);
  }
};

  /* ----------------------------- Render ----------------------------- */
  const selectedCount = selected.size;
  const exactlyOne = selectedCount === 1;

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

        <header className="w-full">
          <div
            className="mx-auto max-w-screen-2xl px-6 lg:px-8 text-center"
            style={{ paddingTop: "5rem", paddingBottom: "1.25rem" }}
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl">
              Gestor de Partidos
            </h1>

            {/* Toolbar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  inputMode="search"
                  placeholder="Buscar por fecha, etapa, estado, jugador…"
                  className="w-full h-11 rounded-lg border border-white/30 bg-neutral-900/80 text-white px-3 text-base placeholder-white/50 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              <button
                onClick={onCreate}
                className="h-11 px-4 rounded-xl border bg-cyan-700/90 text-white border-white shadow-sm hover:bg-cyan-600/90 active:scale-[.98]"
              >
                + Nuevo
              </button>

              <button
                onClick={onEditSelected}
                disabled={!exactlyOne}
                className={`h-11 px-4 rounded-xl border shadow-sm ${
                  exactlyOne
                    ? "bg-neutral-800/90 text-white border-white hover:bg-neutral-700"
                    : "bg-neutral-800/50 text-white/50 border-white/20 cursor-not-allowed"
                }`}
                title="Editar seleccionado"
              >
                Editar
              </button>

              <button
                onClick={onOpenWinners}
                disabled={!exactlyOne}
                className={`h-11 px-4 rounded-xl border shadow-sm ${
                  exactlyOne
                    ? "bg-neutral-800/90 text-white border-white hover:bg-neutral-700"
                    : "bg-neutral-800/50 text-white/50 border-white/20 cursor-not-allowed"
                }`}
                title="Elegir ganadores del seleccionado"
              >
                Elegir ganadores
              </button>

              <button
                onClick={onDeleteSelected}
                disabled={selectedCount === 0}
                className={`h-11 px-4 rounded-xl border shadow-sm ${
                  selectedCount > 0
                    ? "bg-red-700/90 text-white border-white hover:bg-red-600/90"
                    : "bg-red-700/40 text-white/60 border-white/20 cursor-not-allowed"
                }`}
                title="Eliminar seleccionados"
              >
                Eliminar{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </button>
            </div>

            {/* Selection summary */}
            <div className="mt-2 text-sm text-white/70">
              {selectedCount > 0 ? (
                <>
                  {selectedCount} fila(s) seleccionada(s) ·{" "}
                  <button
                    className="underline hover:text-white"
                    onClick={() => setSelected(new Set())}
                  >
                    Limpiar selección
                  </button>
                </>
              ) : (
                <span>Sin selección</span>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          <div className="mx-auto max-w-screen-2xl px-6 lg:px-8 pb-20">
            <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
{loading && (
  <div className="px-6 pt-3 pb-2 text-sm text-white/80">Cargando…</div>
)}


              <div className="overflow-x-auto">
                <table className="w-full text-left text-white whitespace-normal">
                  <thead className="sticky top-0 bg-neutral-800/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-800/70">
                    <tr className="text-sm sm:text-base">
                      <Th className="w-10">
                        <input
                          aria-label="Seleccionar todos"
                          type="checkbox"
                          className="h-4 w-4 align-middle accent-cyan-600"
                          checked={
                            filtered.length > 0 &&
                            filtered.every((p) => selected.has(p.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelected(new Set(filtered.map((p) => p.id)));
                            } else {
                              setSelected(new Set());
                            }
                          }}
                        />
                      </Th>
                      <Th>Fecha</Th>
                      <Th>Estado</Th>
                      <Th>Tipo</Th>
                      <Th>Temporada</Th>
                      <Th>Cancha</Th>
                      <Th>Etapa</Th>
                      <Th>Local</Th>
                      <Th>Visitante</Th>
                      <Th>Ganadores</Th>
                      <Th>Resultado</Th>
                    </tr>
                  </thead>
                  <tbody className="text-sm sm:text-base">
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-6 py-12 text-center border-t border-white/10 text-white/70"
                        >
                          Sin registros
                        </td>
                      </tr>
                    )}
                    {filtered.map((p, i) => {
                      const isSel = selected.has(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`align-top transition-colors cursor-pointer ${
                            i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                          } ${isSel ? "outline outline-2 outline-cyan-600/60" : "hover:bg-neutral-800/60"}`}
                          title={`ID: ${p.id}`}
                          onClick={(e) => {
                            // avoid toggle when clicking the checkbox itself
                            if (e.target.tagName.toLowerCase() === "input") return;
                            const next = new Set(selected);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            setSelected(next);
                          }}
                        >
                          <Td className="w-10">
                            <input
                              aria-label={`Seleccionar ${p.id}`}
                              type="checkbox"
                              className="h-4 w-4 align-middle accent-cyan-600"
                              checked={isSel}
                              onChange={(e) => {
                                const next = new Set(selected);
                                if (e.target.checked) next.add(p.id);
                                else next.delete(p.id);
                                setSelected(next);
                              }}
                            />
                          </Td>
                          <Td>{formatDateTime(p.timestamp)}</Td>
                          <Td className="capitalize">
                            {(p.estado || "").replace(/_/g, " ") || "—"}
                          </Td>
                          <Td className="capitalize">{p.tipoPartido}</Td>
                          <Td>{lookupName(temporadas, p.temporadaID)}</Td>
                          <Td>{lookupName(canchas, p.canchaID)}</Td>
                          <Td>{p.etapa}</Td>
                          <Td>
                            <Pills
                              ids={
                                p.equipoLocal?.length
                                  ? p.equipoLocal
                                  : p.jugadores?.slice(
                                      0,
                                      p.tipoPartido === "dobles" ? 2 : 1
                                    )
                              }
                              options={federados}
                            />
                          </Td>
                          <Td>
                            <Pills
                              ids={
                                p.equipoVisitante?.length
                                  ? p.equipoVisitante
                                  : p.jugadores?.slice(
                                      p.tipoPartido === "dobles" ? 2 : 1
                                    )
                              }
                              options={federados}
                            />
                          </Td>
                          <Td>
                            <Pills
                              ids={p.ganadores || []}
                              options={federados}
                              tone="green"
                            />
                          </Td>
                          <Td>{p.resultado || "—"}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Form modal */}
      {toast && (
  <Toast onClose={() => setToast("")}>
    {toast}
  </Toast>
)}
      {showForm && (
        <Modal
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        >
          <PartidoForm
            value={editing || emptyPartido}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSubmit={onSave}
            datasets={{ temporadas, canchas, federados }}
          />
        </Modal>
      )}

      {/* Winners modal (desde toolbar) */}
      {showWinners && Array.from(selected).length === 1 && (
        <WinnersPickerModal
          partido={partidos.find((p) => p.id === Array.from(selected)[0])}
          federados={federados}
          onCancel={() => setShowWinners(false)}
          onSave={onSaveWinners}
        />
      )}
    </div>
  );
}

/* ----------------------------- UI helpers ----------------------------- */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold border-y border-white/20 text-left ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-4 sm:px-6 py-3 border-t border-white/10 ${className}`}>
      {children}
    </td>
  );
}

function lookupName(list, id) {
  return list?.find?.((x) => x.id === id)?.nombre || id || "—";
}

function getPersons(ids = [], people = []) {
  return ids.map((id) => {
    const it = people.find((o) => o.id === id) || { nombre: id, apellido: "" };
    const label =
      [it.nombre, it.apellido].filter(Boolean).join(" ") || it.email || id;
    return { id, label };
  });
}

function Pills({ ids = [], options = [], tone = "gray" }) {
  const color =
    tone === "green"
      ? "bg-green-500/15 text-green-300 border-green-400/30"
      : "bg-white/10 text-white border-white/20";
  const people = getPersons(ids, options);
  return (
    <div className="flex flex-wrap gap-1.5">
      {people.length === 0 ? (
        <span className="text-white/60">—</span>
      ) : (
        people.map((p) => (
          <span
            key={p.id}
            className={`px-2 py-0.5 rounded-full text-xs border ${color}`}
            title={p.id}
          >
            {p.label}
          </span>
        ))
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full rounded-2xl bg-neutral-900 text-white border border-white/20 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Toast({ children, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <div className="max-w-sm rounded-xl border border-white/20 bg-neutral-900/95 text-white shadow-2xl px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="text-sm whitespace-pre-wrap">{children}</div>
          <button
            className="ml-2 text-white/70 hover:text-white"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Formulario ----------------------------- */
export function PartidoForm({ value, onCancel, onSubmit, datasets }) {
  const [draft, setDraft] = useState(() => ({ ...emptyPartido, ...value }));
  const { temporadas, canchas, federados } = datasets;

  const singles = draft.tipoPartido === "singles";
  const requiredPlayers = singles ? 2 : 4;

  // open/close for player picker
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);

  useEffect(() => {
    setDraft((d) => {
      const next = { ...d };
      const isSingles = next.tipoPartido === "singles";
      if (isSingles && next.jugadores.length > 2)
        next.jugadores = next.jugadores.slice(0, 2);
      if (!isSingles && next.jugadores.length > 4)
        next.jugadores = next.jugadores.slice(0, 4);
      const maxWinners = isSingles ? 1 : 2;
      next.ganadores = (next.ganadores || [])
        .filter((id) => next.jugadores.includes(id))
        .slice(0, maxWinners);
      next.equipoLocal = (next.equipoLocal || []).filter((id) =>
        next.jugadores.includes(id)
      );
      next.equipoVisitante = (next.equipoVisitante || []).filter((id) =>
        next.jugadores.includes(id)
      );
      return next;
    });
  }, [draft.tipoPartido]);

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (formValid) onSubmit?.(draft);
  };

  const subset = (arr, sup) => (arr || []).every((id) => sup.includes(id));
  const formValid =
    !!draft.timestamp &&
    !!draft.estado &&
    !!draft.tipoPartido &&
    !!draft.etapa &&
    !!draft.temporadaID &&
    !!draft.canchaID &&
    Array.isArray(draft.jugadores) &&
    draft.jugadores.length === requiredPlayers &&
    subset(draft.equipoLocal, draft.jugadores) &&
    subset(draft.equipoVisitante, draft.jugadores) &&
    subset(draft.ganadores, draft.jugadores) &&
    (draft.ganadores?.length || 0) <= (singles ? 1 : 2);

  const selectedChips = (ids = []) =>
    ids.map((id) => {
      const u =
        federados.find((f) => f.id === id) || { nombre: id, apellido: "" };
      const label =
        `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || u.email || id;
      return (
        <span
          key={id}
          className="px-2 py-0.5 rounded-full text-xs border bg-white/10 text-white border-white/20"
          title={id}
        >
          {label}
        </span>
      );
    });

  return (
    <>
      <form onSubmit={submit} className="p-6 space-y-6">
        {/* Header actions */}
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold">
            {draft.id ? "Editar partido" : "Nuevo partido"}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formValid}
              className={`px-4 py-2 rounded-xl text-white ${
                formValid
                  ? "bg-cyan-700 hover:bg-cyan-600"
                  : "bg-cyan-700/40 cursor-not-allowed"
              }`}
              title={formValid ? "Guardar" : "Complete los campos requeridos"}
            >
              Guardar
            </button>
          </div>
        </div>

        {/* Compact, balanced grid; long sections span full width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm">Fecha y hora</label>
            <input
              type="datetime-local"
              required
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
              value={toLocalInputValue(draft.timestamp)}
              onChange={(e) =>
                setField("timestamp", toISOFromLocal(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Estado</label>
            <select
              required
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2 capitalize"
              value={draft.estado || "programado"}
              onChange={(e) => setField("estado", e.target.value)}
            >
              <option value="programado">Programado</option>
              <option value="en_juego">En juego</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Tipo de partido</label>
            <select
              required
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
              value={draft.tipoPartido}
              onChange={(e) => setField("tipoPartido", e.target.value)}
            >
              <option value="singles">Singles</option>
              <option value="dobles">Dobles</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Etapa</label>
            <input
              required
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
              value={draft.etapa}
              onChange={(e) => setField("etapa", e.target.value)}
              placeholder="ej: semifinal, final…"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Temporada</label>
            <select
              required
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
              value={draft.temporadaID}
              onChange={(e) => setField("temporadaID", e.target.value)}
            >
              <option value="">Seleccione…</option>
              {datasetsToOptions(temporadas)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Cancha</label>
            <select
              required
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
              value={draft.canchaID}
              onChange={(e) => setField("canchaID", e.target.value)}
            >
              <option value="">Seleccione…</option>
              {datasetsToOptions(canchas)}
            </select>
          </div>

          {/* Jugadores row spans full width to avoid empty space */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm">
                Jugadores ({draft.jugadores.length}/{requiredPlayers})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlayerPickerOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10"
                >
                  Elegir jugadores…
                </button>
                {draft.jugadores.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setField("jugadores", [])}
                    className="px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {draft.jugadores.length === 0 ? (
                <span className="text-white/60 text-sm">
                  Ningún jugador seleccionado.
                </span>
              ) : (
                selectedChips(draft.jugadores)
              )}
            </div>
            <div className="text-xs text-white/60">
              Deben ser exactamente {requiredPlayers} jugadores.
            </div>
          </div>

          {/* Equipos */}
          <div className="space-y-2">
            <label className="block text-sm">
              Equipo Local ({draft.equipoLocal.length})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedChips(draft.equipoLocal)}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(draft.jugadores || []).map((id) => {
                const on = draft.equipoLocal.includes(id);
                const toggle = () =>
                  setField(
                    "equipoLocal",
                    on
                      ? draft.equipoLocal.filter((x) => x !== id)
                      : [...draft.equipoLocal, id]
                  );
                const u =
                  federados.find((f) => f.id === id) || { nombre: id, apellido: "" };
                const label =
                  `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() ||
                  u.email ||
                  id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={toggle}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      on
                        ? "bg-cyan-700 text-white border-cyan-500"
                        : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">
              Equipo Visitante ({draft.equipoVisitante.length})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedChips(draft.equipoVisitante)}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(draft.jugadores || []).map((id) => {
                const on = draft.equipoVisitante.includes(id);
                const toggle = () =>
                  setField(
                    "equipoVisitante",
                    on
                      ? draft.equipoVisitante.filter((x) => x !== id)
                      : [...draft.equipoVisitante, id]
                  );
                const u =
                  federados.find((f) => f.id === id) || { nombre: id, apellido: "" };
                const label =
                  `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() ||
                  u.email ||
                  id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={toggle}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      on
                        ? "bg-cyan-700 text-white border-cyan-500"
                        : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ganadores (short) */}
          <div className="space-y-2">
            <label className="block text-sm">
              Ganadores ({draft.ganadores?.length || 0}/{singles ? 1 : 2})
            </label>
            <div className="flex flex-wrap gap-2">
              {(draft.jugadores || []).map((id) => {
                const on = draft.ganadores.includes(id);
                const toggle = () =>
                  setField(
                    "ganadores",
                    on
                      ? draft.ganadores.filter((x) => x !== id)
                      : [...draft.ganadores].slice(0, (singles ? 1 : 2) - 1).concat(id)
                  );
                const u =
                  federados.find((f) => f.id === id) || { nombre: id, apellido: "" };
                const label =
                  `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() ||
                  u.email ||
                  id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={
                      !on &&
                      draft.ganadores.length >= (singles ? 1 : 2)
                    }
                    onClick={toggle}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      on
                        ? "bg-green-700 text-white border-green-500"
                        : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700 disabled:opacity-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-white/60">
              Máx {singles ? 1 : 2} ganador(es).
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Resultado</label>
            <input
              className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
              value={draft.resultado}
              onChange={(e) => setField("resultado", e.target.value)}
              placeholder="ej: 6-3 6-4"
            />
          </div>
        </div>
      </form>

      {/* Player picker modal */}
      {playerPickerOpen && (
        <PlayerPickerModal
          initialSelected={draft.jugadores}
          players={federados}
          maxCount={requiredPlayers}
          onCancel={() => setPlayerPickerOpen(false)}
          onSave={(ids) => {
            setField("jugadores", limitPlayers(ids, requiredPlayers));
            setPlayerPickerOpen(false);
          }}
          title="Elegir jugadores"
        />
      )}
    </>
  );
}


/* winners modal (global) */
function WinnersPickerModal({ partido, federados, onCancel, onSave }) {
  const maxWinners = partido?.tipoPartido === "singles" ? 1 : 2;
  const available = federados.filter((f) => (partido?.jugadores || []).includes(f.id));
  const [local, setLocal] = useState(partido?.ganadores || []);

  useEffect(() => {
    setLocal(partido?.ganadores || []);
  }, [partido?.id, partido?.ganadores]);

  const toggle = (id) => {
    setLocal((curr) => {
      const set = new Set(curr);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set)
        .filter((x) => (partido?.jugadores || []).includes(x))
        .slice(0, maxWinners);
    });
  };

  return (
    <Modal onClose={onCancel}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Elegir ganadores</h3>
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10">Cerrar</button>
        </div>
        <div className="text-xs text-white/70">
          Partido: <strong>{formatDateTime(partido?.timestamp)}</strong> · {lookupName([], partido?.id)}
          <br />Máx {maxWinners} ganador(es). Deben ser jugadores del partido.
        </div>
        <div className="flex flex-wrap gap-2">
          {available.map((f) => (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className={`px-2.5 py-1 rounded-full text-xs border ${
                local.includes(f.id)
                  ? "bg-cyan-700 text-white border-cyan-500"
                  : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
              }`}
            >
              {[f.nombre, f.apellido].filter(Boolean).join(" ") || f.email || f.id}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => onSave?.(local)}
            className="px-4 py-2 rounded-xl bg-cyan-700 text-white hover:bg-cyan-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* commons */
function datasetsToOptions(list = []) {
  return list.map((t) => (
    <option key={t.id} value={t.id}>
      {t.nombre || t.id}
    </option>
  ));
}

function MultiSelect({ label, value = [], onChange, options = [], getLabel }) {
  const toggle = (id) => {
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange?.(Array.from(set));
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm">{label}</label>
      <div className="flex flex-wrap gap-2 border border-white/20 rounded-xl p-2 min-h-[44px] bg-neutral-900">
        {options.map((o) => (
          <button
            type="button"
            key={o.id}
            onClick={() => toggle(o.id)}
            className={`px-2.5 py-1 rounded-full text-xs border ${
              value.includes(o.id)
                ? "bg-cyan-700 text-white border-cyan-500"
                : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
            }`}
            title={o.email || o.id}
          >
            {getLabel ? getLabel(o) : o.nombre || o.id}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Validaciones + payload ----------------------------- */
function validatePartido(p) {
  const errs = [];
  const singles = p.tipoPartido === "singles";
  if (!p.timestamp) errs.push("timestamp es requerido");
  if (!p.estado) errs.push("estado es requerido");
  if (!p.tipoPartido) errs.push("tipoPartido es requerido");
  if (!p.temporadaID) errs.push("temporadaID es requerido");
  if (!p.canchaID) errs.push("canchaID es requerido");
  if (!p.etapa) errs.push("etapa es requerido");
  if (!Array.isArray(p.jugadores) || p.jugadores.length !== (singles ? 2 : 4)) {
    errs.push(`jugadores debe tener exactamente ${singles ? 2 : 4}`);
  }
  const inJugadores = (arr) => (arr || []).every((id) => p.jugadores.includes(id));
  if (!inJugadores(p.equipoLocal))
    errs.push("equipoLocal debe ser subconjunto de jugadores");
  if (!inJugadores(p.equipoVisitante))
    errs.push("equipoVisitante debe ser subconjunto de jugadores");
  if (!inJugadores(p.ganadores))
    errs.push("ganadores debe ser subconjunto de jugadores");
  if ((p.ganadores || []).length > (singles ? 1 : 2))
    errs.push(`máximo de ganadores: ${singles ? 1 : 2}`);
  return errs;
}

function sanitizePayload(p) {
  return {
    timestamp: p.timestamp,
    estado: p.estado,
    tipoPartido: p.tipoPartido,
    temporadaID: p.temporadaID,
    canchaID: p.canchaID,
    etapa: p.etapa,
    jugadores: uniq(p.jugadores),
    equipoLocal: uniq(p.equipoLocal).filter((id) => p.jugadores.includes(id)),
    equipoVisitante: uniq(p.equipoVisitante).filter((id) =>
      p.jugadores.includes(id)
    ),
    ganadores: uniq(p.ganadores).filter((id) => p.jugadores.includes(id)),
    resultado: p.resultado || null,
  };
}

function uniq(arr = []) {
  return Array.from(new Set(arr));
}
function limitPlayers(arr = [], n) {
  return uniq(arr).slice(0, n);
}
