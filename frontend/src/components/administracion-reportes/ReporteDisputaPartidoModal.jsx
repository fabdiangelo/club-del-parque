import React, { useEffect, useMemo, useRef, useState } from "react";

const fetchJSON = async (path, opts = {}) => {
  const res = await fetch(path, {
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

function NamesList({ ids = [], fedMap, inline = false }) {
  const items = ids.map((id) => {
    const f = fedMap.get(id);
    if (f) {
      const full = `${f?.nombre ?? ""} ${f?.apellido ?? ""}`.trim();
      return full || f.email || id;
    }
    return String(id);
  });
  if (inline) return <span>{items.join(" / ") || "—"}</span>;
  return (
    <ul className="list-disc pl-5">
      {items.length ? items.map((n, i) => <li key={i}>{n}</li>) : <li>—</li>}
    </ul>
  );
}

export default function ReporteDisputaPartidoModal({
  reporte,        // { id, partidoID | partidoId | partido, motivo, descripcion, mailUsuario, fecha, tipo, ... }
  onResuelto,     // async (idReporte) => void
  onClose,        // () => void   (puede cerrar sin resolver)
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [partido, setPartido] = useState(null);
  const [federados, setFederados] = useState([]);
  const [winner, setWinner] = useState("A"); // "A" | "B"
  const [reportador, setReportador] = useState(null);

  // 🔑 texto editable del resultado
  const [resultadoInput, setResultadoInput] = useState("");
  const didPrefillRef = useRef(false);

  useEffect(() => {
    const fetchReportador = async () => {
      if (!reporte?.mailUsuario) return;
      try {
        const u = await fetchJSON(
          `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/byMail/${encodeURIComponent(reporte.mailUsuario)}`
        );
        setReportador(u);
      } catch {
        setReportador(null);
      }
    };
    fetchReportador();
  }, [reporte?.mailUsuario]);

  const partidoId =
    reporte?.partidoId || reporte?.partidoID || reporte?.partido || null;

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      if (!partidoId) throw new Error("Este reporte no tiene partidoID asociado.");

      const [p, fs] = await Promise.all([
        fetchJSON(`/partidos/${partidoId}`),
        fetchJSON(`/usuarios/federados`),
      ]);

      setPartido(p);
      setFederados(Array.isArray(fs) ? fs : []);

      const existingRes = p?.resultado || p?.propuestaResultado?.resultado || "";
      // 👉 Precargar SOLO una vez, luego el admin puede escribir libremente
      if (!didPrefillRef.current) {
        setResultadoInput(existingRes || "");
        didPrefillRef.current = true;
      }
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
    didPrefillRef.current = false; // nuevo partido => permitir un prefill
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partidoId]);

  // === Map de federados (id -> objeto) para resolver nombres
  const fedMap = useMemo(
    () => new Map((federados || []).map((f) => [f.id, f])),
    [federados]
  );

  // Ids de equipos de forma robusta
  const equipoAIds = useMemo(() => {
    const raw = partido?.equipoA || partido?.jugadoresA || partido?.equipo1 || [];
    if (Array.isArray(raw) && raw.length)
      return raw.map((x) => (typeof x === "object" ? x.id : x)).filter(Boolean);
    const all = Array.isArray(partido?.jugadores) ? partido.jugadores : [];
    return partido?.tipoPartido === "dobles" ? all.slice(0, 2) : all.slice(0, 1);
  }, [partido]);

  const equipoBIds = useMemo(() => {
    const raw = partido?.equipoB || partido?.jugadoresB || partido?.equipo2 || [];
    if (Array.isArray(raw) && raw.length)
      return raw.map((x) => (typeof x === "object" ? x.id : x)).filter(Boolean);
    const all = Array.isArray(partido?.jugadores) ? partido.jugadores : [];
    return partido?.tipoPartido === "dobles" ? all.slice(2, 4) : all.slice(1, 2);
  }, [partido]);

  const equipoAText = useMemo(() => {
    return equipoAIds
      .map((id) => {
        const f = fedMap.get(id);
        if (f) {
          const full = `${f?.nombre ?? ""} ${f?.apellido ?? ""}`.trim();
          return full || f.email || id;
        }
        return String(id);
      })
      .join(" / ");
  }, [equipoAIds, fedMap]);

  const equipoBText = useMemo(() => {
    return equipoBIds
      .map((id) => {
        const f = fedMap.get(id);
        if (f) {
          const full = `${f?.nombre ?? ""} ${f?.apellido ?? ""}`.trim();
          return full || f.email || id;
        }
        return String(id);
      })
      .join(" / ");
  }, [equipoBIds, fedMap]);

  const resolverConflicto = async () => {
    if (!partidoId) return;

    const resultado = (resultadoInput || "").trim();
    if (!resultado) {
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

      await fetchJSON(`/partidos/${partidoId}`, {
        method: "PUT",
        body: JSON.stringify({
          resultado,
          estado: "finalizado",
          estadoResultado: "confirmado",
          disputaResuelta: true,
          disputaFechaResuelta: new Date().toISOString(),
          propuestaResultado: null,
        }),
      });

      await onResuelto?.(reporte.id);
      alert("Disputa resuelta, resultado actualizado y reporte marcado como resuelto.");
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



  const handleClose = () => onClose?.();

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/60 p-4" style={{ zIndex: 1000 }} onClick={handleClose}>
      <div
        className="max-w-3xl w-full rounded-2xl bg-white text-neutral-900 border border-neutral-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: 'white' }}>Disputa de resultado</h3>
          <button className="btn btn-ghost btn-sm" onClick={handleClose} title="Cerrar">
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
                  <div className="badge badge-outline capitalize">{partido?.estado || "—"}</div>
                </Field>
                <Field label="Motivo del reporte">
                  <div className="text-sm">{reporte?.motivo}</div>
                </Field>
                <Field label="Reportado por">
                  <div className="text-sm">
                    {reportador
                      ? `${reportador.nombre} ${reportador.apellido} (${reportador.email})`
                      : reporte?.mailUsuario || "—"}
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <Field label="Equipo A (nombres)">
                  <div className="text-sm font-medium">{equipoAText || "—"}</div>
                </Field>
                <Field label="Equipo B (nombres)">
                  <div className="text-sm font-medium">{equipoBText || "—"}</div>
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <a
                  className="btn btn-outline btn-sm"
                  href={`/partidos/${partidoId}/acuerdo`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ir al acuerdo del partido
                </a>
              </div>

              <div className="divider" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Equipo ganador">
                  <div className="join">
                    <button
                      className={`btn join-item ${winner === "A" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setWinner("A")}
                    >
                      Equipo A
                    </button>
                    <button
                      className={`btn join-item ${winner === "B" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setWinner("B")}
                    >
                      Equipo B
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    A: <NamesList ids={equipoAIds} fedMap={fedMap} inline /> · B:{" "}
                    <NamesList ids={equipoBIds} fedMap={fedMap} inline />
                  </p>
                </Field>

                <Field label="Resultado final (ej: 6-4, 7-6(7-4))">
                  <input
                    type="text"
                    autoComplete="off"
                    className="input input-bordered w-full"
                    value={resultadoInput ?? ""}
                    onChange={(e) => setResultadoInput(e.target.value)}
                    placeholder="6-4, 6-4"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button className="btn" onClick={handleClose}>
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
