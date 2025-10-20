// src/components/administracion-reportes/ReporteDisputaPartidoModal.jsx
import React, { useEffect, useMemo, useState } from "react";

const toApi = (p) => (p?.startsWith("/api/") ? p : `/api${p}`);

const fetchJSON = async (path, opts = {}) => {
  const res = await fetch(toApi(path), {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    cache: "no-store",
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
};

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

export default function ReporteDisputaPartidoModal({
  reporte,        // { id, partidoID, motivo, descripcion, mailUsuario, fecha, tipo, ... }
  onResuelto,     // async (idReporte) => void
  onClose,        // () => void   (NO cerrar hasta resolver)
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [partido, setPartido] = useState(null);
  const [resultado, setResultado] = useState("");
  const [winner, setWinner] = useState("A"); // "A" | "B"
  const [resueltoAqui, setResueltoAqui] = useState(false);

  const partidoId = reporte?.partidoId || reporte?.partidoID || reporte?.partido || null;

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      if (!partidoId) throw new Error("Este reporte no tiene partidoID asociado.");
      const p = await fetchJSON(`/partidos/${partidoId}`);
      setPartido(p);
      const existingRes = p?.resultado || p?.propuestaResultado?.resultado || "";
      if (existingRes) setResultado(existingRes);
    } catch (e) {
      try {
        const obj = JSON.parse(String(e?.message ?? e));
        setError(obj?.mensaje || obj?.error || String(e));
      } catch {
        setError(String(e?.message ?? e));
      }
      setPartido(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partidoId]);

  // Derivar ids de equipos de forma robusta
  const equipoAIds = useMemo(() => {
    const raw = partido?.equipoA || partido?.jugadoresA || partido?.equipo1 || [];
    if (Array.isArray(raw) && raw.length)
      return raw.map((x) => (typeof x === "object" ? x.id : x));
    const all = Array.isArray(partido?.jugadores) ? partido.jugadores : [];
    return partido?.tipoPartido === "dobles" ? all.slice(0, 2) : all.slice(0, 1);
  }, [partido]);

  const equipoBIds = useMemo(() => {
    const raw = partido?.equipoB || partido?.jugadoresB || partido?.equipo2 || [];
    if (Array.isArray(raw) && raw.length)
      return raw.map((x) => (typeof x === "object" ? x.id : x));
    const all = Array.isArray(partido?.jugadores) ? partido.jugadores : [];
    return partido?.tipoPartido === "dobles" ? all.slice(2, 4) : all.slice(1, 2);
  }, [partido]);

  const resolverConflicto = async () => {
    if (!partidoId) return;
    if (!resultado?.trim()) {
      alert("Debés escribir el resultado final (por ej. 6-4, 7-6(7-4)).");
      return;
    }
    const ganadores = winner === "A" ? equipoAIds : equipoBIds;
    if (!ganadores?.length) {
      alert("No se detectaron jugadores en el equipo ganador.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // 1) fijar ganadores
      await fetchJSON(`/partidos/${partidoId}/ganadores`, {
        method: "POST",
        body: JSON.stringify({ ganadores }),
      });

      // 2) cerrar disputa y finalizar
      await fetchJSON(`/partidos/${partidoId}`, {
        method: "PUT",
        body: JSON.stringify({
          resultado: resultado.trim(),
          estado: "finalizado",
          estadoResultado: "confirmado",
          disputaResuelta: true,
          disputaFechaResuelta: new Date().toISOString(),
          propuestaResultado: null,
        }),
      });

      // 3) marcar reporte como resuelto
      await onResuelto?.(reporte.id);
      setResueltoAqui(true);
      alert("Disputa resuelta y reporte marcado como resuelto.");
    } catch (e) {
      try {
        const obj = JSON.parse(String(e?.message ?? e));
        setError(obj?.mensaje || obj?.error || String(e));
      } catch {
        setError(String(e?.message ?? e));
      }
    } finally {
      setSaving(false);
    }
  };

  const intentarCerrar = () => {
    if (!resueltoAqui) {
      alert("Para cerrar este modal primero resolvé la disputa.");
      return;
    }
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={intentarCerrar}
    >
      <div
        className="max-w-3xl w-full rounded-2xl bg-white text-neutral-900 border border-neutral-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Disputa de resultado</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={intentarCerrar}
            disabled={!resueltoAqui}
            title={!resueltoAqui ? "Resolvé la disputa para cerrar" : "Cerrar"}
          >
            Cerrar
          </button>
        </div>

        <div className="p-6 grid gap-4">
          {loading ? (
            <div className="text-neutral-500">Cargando datos del partido…</div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : !partido ? (
            <div className="alert">No se encontró el partido asociado.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ID del partido">
                  <div className="font-mono text-sm">{partidoId}</div>
                </Field>
                <Field label="Estado actual">
                  <div className="badge badge-outline capitalize">
                    {partido?.estado || "—"}
                  </div>
                </Field>
                <Field label="Motivo del reporte">
                  <div className="text-sm">{reporte?.motivo}</div>
                </Field>
                <Field label="Reportado por">
                  <div className="text-sm">{reporte?.mailUsuario || "—"}</div>
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1">
                <a
                  className="btn btn-outline btn-sm"
                  href={`/partidos/${partidoId}/acuerdo`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ir al acuerdo del partido
                </a>
                {resueltoAqui && (
                  <span className="badge badge-success">Resuelto</span>
                )}
              </div>

              <div className="divider" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Equipo ganador">
                  <div className="join">
                    <button
                      className={`btn join-item ${
                        winner === "A" ? "btn-primary" : "btn-outline"
                      }`}
                      onClick={() => setWinner("A")}
                    >
                      Equipo A
                    </button>
                    <button
                      className={`btn join-item ${
                        winner === "B" ? "btn-primary" : "btn-outline"
                      }`}
                      onClick={() => setWinner("B")}
                    >
                      Equipo B
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    A: {JSON.stringify(equipoAIds)} · B: {JSON.stringify(equipoBIds)}
                  </p>
                </Field>

                <Field label="Resultado final (ej: 6-4, 7-6(7-4))">
                  <input
                    className="input input-bordered w-full"
                    value={resultado}
                    onChange={(e) => setResultado(e.target.value)}
                    placeholder="6-3, 3-6, 7-6(7-5)"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  className="btn"
                  onClick={intentarCerrar}
                  disabled={!resueltoAqui}
                >
                  Cerrar
                </button>
                <button
                  className={`btn btn-primary ${saving ? "loading" : ""}`}
                  onClick={resolverConflicto}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Resolver disputa y cerrar reporte"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
