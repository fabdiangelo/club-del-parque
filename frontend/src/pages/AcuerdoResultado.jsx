// src/pages/AcuerdoResultado.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthProvider";

// 🔔 Realtime DB para notificaciones
import { ref, push, set } from "firebase/database";
import { dbRT } from "../utils/FirebaseService.js";

const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);

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

const fetchJSONorNull = async (path, opts = {}) => {
  const res = await fetch(toApi(path), {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    cache: "no-store",
    ...opts,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
};

const formatDT = (iso) => {
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

/* ---------------- Helpers de notificaciones (campana) ---------------- */

// Crea 1 notificación para un UID
async function pushNotiFor(uid, payload) {
  const notiRef = push(ref(dbRT, `notificaciones/${uid}`));
  await set(notiRef, {
    id: notiRef.key,
    leido: false,
    fecha: Date.now(),
    ...payload, // { tipo, resumen, href, partidoId? }
  });
}

/**
 * Notifica a una lista de jugadores.
 * - tipo: "partido_acuerdo"
 * - resumen: texto visible en la campana
 * - href: link a /partidos/:id/acuerdo
 */
async function notificarAcuerdoPartido(jugadoresUids = [], partidoId, resumen) {
  if (!Array.isArray(jugadoresUids) || jugadoresUids.length === 0) return;
  const payload = {
    tipo: "partido_acuerdo",
    resumen,
    href: `/partidos/${partidoId}/acuerdo`,
    partidoId,
  };
  await Promise.all(jugadoresUids.map((uid) => pushNotiFor(uid, payload)));
}

export default function AcuerdoResultado() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [partido, setPartido] = useState(null);
  const [federados, setFederados] = useState([]);

  const [resultado, setResultado] = useState("");
  const [ganadores, setGanadores] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const p = await fetchJSONorNull(`/partidos/${id}`);
      if (!p) throw new Error("Partido no encontrado");
      const fs = await fetchJSON(`/usuarios/federados`);
      setPartido(p);
      setFederados(Array.isArray(fs) ? fs : []);

      const existingRes = p?.propuestaResultado?.resultado || p?.resultado || "";
      const existingGan = Array.isArray(p?.propuestaResultado?.ganadores)
        ? p.propuestaResultado.ganadores
        : Array.isArray(p?.ganadores)
          ? p.ganadores
          : [];
      setResultado(existingRes);
      setGanadores(existingGan);
    } catch (e) {
      setErr(normalizeError(e));
      setPartido(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading) reload();
  }, [authLoading, reload]);

  const jugadoresIds = useMemo(() => partido?.jugadores || [], [partido]);
  const soyJugador = useMemo(
    () => !!user && jugadoresIds.includes(user?.uid || user?.id),
    [user, jugadoresIds]
  );

  const yaFinalizado =
    partido?.estado === "finalizado" ||
    (Array.isArray(partido?.ganadores) && partido.ganadores.length > 0);

  const propuesta = partido?.propuestaResultado || null;
  const propuestaPendiente = !!(propuesta && !yaFinalizado);

  const yoPropuse =
    propuestaPendiente && propuesta.propuestoPor === (user?.uid || user?.id);

  const puedoConfirmar = propuestaPendiente && !yoPropuse && soyJugador;

  const maxWinners = partido?.tipoPartido === "dobles" ? 2 : 1;

  const jugadoresDetalle = useMemo(() => {
    const map = new Map(federados.map((f) => [f.id, f]));
    return jugadoresIds.map((id) => map.get(id) || { id, nombre: id });
  }, [federados, jugadoresIds]);

  const ganadorLabels = (ids) => {
    const map = new Map(
      federados.map((f) => [
        f.id,
        `${f.nombre ?? ""} ${f.apellido ?? ""}`.trim() || f.email || f.id,
      ])
    );
    return ids.map((i) => map.get(i) || i).join(", ");
  };

  const onProponer = async () => {
    if (!soyJugador || yaFinalizado) return;

    if (!resultado.trim()) return alert("Ingresa el resultado, ej: 6-3 6-4");

    if (
      !Array.isArray(ganadores) ||
      ganadores.length === 0 ||
      ganadores.length > maxWinners
    )
      return alert(
        `Selecciona ${maxWinners === 1 ? "1" : `hasta ${maxWinners}`} ganador(es).`
      );

    if (!ganadores.every((g) => jugadoresIds.includes(g)))
      return alert("Los ganadores deben ser jugadores del partido.");

    setSubmitting(true);
    setErr("");
    try {
      // 1) Guardar propuesta
      await fetchJSON(`/partidos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          propuestaResultado: {
            resultado,
            ganadores,
            propuestoPor: user?.uid || user?.id,
            fecha: new Date().toISOString(),
          },
          estadoResultado: "pendiente",
        }),
      });

      // 2) Notificar al/los otros jugadores (campana)
      const miUid = user?.uid || user?.id;
      const otros = jugadoresIds.filter((j) => j !== miUid);
      await notificarAcuerdoPartido(
        otros,
        id,
        "Un jugador propuso un resultado. Revisá y confirmá."
      );

      await reload();
      alert("Propuesta enviada. El otro jugador debe confirmarla.");
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmar = async (acepta) => {
    if (!puedoConfirmar) return;

    setSubmitting(true);
    setErr("");
    try {
      if (acepta) {
        // 1) Grabar ganadores y cerrar partido
        await fetchJSON(`/partidos/${id}/ganadores`, {
          method: "POST",
          body: JSON.stringify({ ganadores: propuesta.ganadores }),
        });
        await fetchJSON(`/partidos/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            resultado: propuesta.resultado,
            estado: "finalizado",
            propuestaResultado: null,
            estadoResultado: "confirmado",
            confirmadoPor: user?.uid || user?.id,
            fechaConfirmado: new Date().toISOString(),
          }),
        });

        // 2) Notificar a TODOS los jugadores que se confirmó
        await notificarAcuerdoPartido(
          jugadoresIds,
          id,
          "El resultado del partido fue confirmado."
        );
      } else {
        // 1) Crear reporte de disputa y marcar estado
        await fetchJSON(`/reportes`, {
          method: "POST",
          body: JSON.stringify({
            tipo: "disputa_resultado",
            partidoID: id,
            jugadores: jugadoresIds,
            detalle: "Discrepancia en resultado reportada por jugador",
          }),
        });
        await fetchJSON(`/partidos/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            estadoResultado: "en_disputa",
            disputaCreada: true,
            disputaFecha: new Date().toISOString(),
          }),
        });

        // 2) Notificar a TODOS los jugadores que hay disputa
        await notificarAcuerdoPartido(
          jugadoresIds,
          id,
          "Hay una disputa en el resultado del partido."
        );
      }

      await reload();
      alert(
        acepta
          ? "Resultado confirmado. ¡Gracias!"
          : "Se registró la disputa. Un administrador resolverá."
      );
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const abrirPicker = () => setPickerOpen(true);
  const cerrarPicker = () => setPickerOpen(false);

  const opcionesGanadores = useMemo(
    () =>
      jugadoresDetalle.filter((p) =>
        `${p.nombre ?? ""} ${p.apellido ?? ""}`
          .toLowerCase()
          .includes(pickerQuery.toLowerCase())
      ),
    [jugadoresDetalle, pickerQuery]
  );

  const toggleWinner = (id) => {
    setGanadores((curr) => {
      const s = new Set(curr);
      if (s.has(id)) s.delete(id);
      else {
        s.add(id);
        if (s.size > maxWinners) {
          const arr = Array.from(s);
          const last = arr[arr.length - 1];
          return [last];
        }
      }
      return Array.from(s);
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-white/80">Cargando…</div>
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-xl mx-auto px-4" style={{ paddingTop: "6rem" }}>
          <h1 className="text-2xl font-bold text-white">Acuerdo de resultado</h1>
          <p className="mt-2 text-red-300">Error: {err || "Partido no encontrado"}</p>
          <button
            className="mt-4 px-4 py-2 rounded bg-neutral-800 text-white"
            onClick={() => navigate(-1)}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const readOnly =
    !soyJugador || yaFinalizado || partido?.estadoResultado === "en_disputa";
  const tituloEstado = yaFinalizado
    ? "Finalizado"
    : partido?.estadoResultado === "en_disputa"
    ? "En disputa (admin resolverá)"
    : propuestaPendiente
    ? yoPropuse
      ? "Propuesta enviada — esperando confirmación"
      : "Tienes una propuesta para confirmar"
    : "Pendiente de propuesta";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div
        className="mx-auto max-w-3xl px-4"
        style={{ paddingTop: "6rem", paddingBottom: "3rem" }}
      >
        <h1 className="text-3xl font-extrabold text-white">Acuerdo de resultado</h1>
        <div className="mt-2 text-white/80 text-sm">
          <div>
            Partido: <strong>{formatDT(partido.timestamp)}</strong> · {partido.tipoPartido} ·
            Etapa: {partido.etapa || "—"}
          </div>
          <div>
            Estado: <span className="font-semibold">{tituloEstado}</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/15 bg-neutral-900/70 p-4">
          <h2 className="text-lg font-semibold text-white">Jugadores</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {jugadoresDetalle.map((j) => (
              <span
                key={j.id}
                className="px-2 py-1 rounded-full text-xs border border-white/20 text-white/90 bg-white/10"
              >
                {`${j.nombre ?? ""} ${j.apellido ?? ""}`.trim() || j.email || j.id}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/15 bg-neutral-900/70 p-4">
            <label className="block text-sm text-white/80 mb-1">Resultado</label>
            <input
              disabled={readOnly || (yoPropuse && propuestaPendiente)} // no editar después de proponer
              className="w-full rounded-lg border border-white/20 bg-neutral-800 px-3 py-2 text-white placeholder-white/40"
              placeholder="ej: 6-3 6-4"
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              required
            />
            {!!partido.resultado && (
              <div className="mt-2 text-xs text-white/60">
                Resultado actual: {partido.resultado}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/15 bg-neutral-900/70 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm text-white/80">Ganador(es)</label>
              <button
                disabled={readOnly || (yoPropuse && propuestaPendiente)}
                onClick={abrirPicker}
                className={`px-3 py-1.5 rounded-lg border ${
                  readOnly
                    ? "border-white/20 text-white/40"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                Seleccionar
              </button>
            </div>
            <div className="mt-2 text-white/90 text-sm">
              {ganadores.length ? (
                ganadorLabels(ganadores)
              ) : (
                <span className="text-white/50">Ninguno</span>
              )}
            </div>
            {!!partido.ganadores?.length && (
              <div className="mt-2 text-xs text-white/60">
                Ganadores actuales: {ganadorLabels(partido.ganadores)}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!soyJugador && (
          <div className="mt-6 text-yellow-300 text-sm">
            Solo los jugadores del partido pueden proponer o confirmar el resultado.
          </div>
        )}

        {partido?.estadoResultado === "en_disputa" && (
          <div className="mt-6 text-red-300 text-sm">
            Hay una disputa abierta. Un administrador fijará el resultado final.
          </div>
        )}

        {!yaFinalizado && soyJugador && (
          <div className="mt-6 flex flex-wrap gap-3">
            {!propuestaPendiente && (
              <button
                disabled={readOnly || submitting}
                onClick={onProponer}
                className="px-5 py-2 rounded-xl bg-cyan-700 text-white hover:bg-cyan-600 disabled:opacity-50"
              >
                Proponer resultado
              </button>
            )}

            {puedoConfirmar && (
              <>
                <button
                  disabled={submitting}
                  onClick={() => onConfirmar(true)}
                  className="px-5 py-2 rounded-xl bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  Aceptar propuesta
                </button>
                <button
                  disabled={submitting}
                  onClick={() => onConfirmar(false)}
                  className="px-5 py-2 rounded-xl bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Rechazar (escalar a admin)
                </button>
              </>
            )}
          </div>
        )}

        {yaFinalizado && (
          <div className="mt-6 text-green-400 text-sm">
            Partido finalizado. No se puede editar.
          </div>
        )}

        {/* Error toast */}
        {err && (
          <div className="mt-6 rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 px-4 py-3">
            {err}
          </div>
        )}
      </div>

      {/* Winner picker modal */}
      {pickerOpen && (
        <Modal onClose={cerrarPicker}>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-semibold">
                Seleccionar ganador(es) (máx {maxWinners})
              </h3>
              <button
                onClick={cerrarPicker}
                className="px-3 py-1.5 rounded-lg border border-white/30 text-white hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-3">
              <input
                className="w-full rounded-lg border border-white/20 bg-neutral-800 px-3 py-2 text-white placeholder-white/40"
                placeholder="Buscar jugador…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {opcionesGanadores.map((j) => {
                const id = j.id;
                const label =
                  `${j.nombre ?? ""} ${j.apellido ?? ""}`.trim() ||
                  j.email ||
                  id;
                const active = ganadores.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleWinner(id)}
                    className={`px-3 py-1.5 rounded-full text-xs border ${
                      active
                        ? "bg-cyan-700 text-white border-cyan-500"
                        : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {opcionesGanadores.length === 0 && (
                <div className="text-white/60 text-sm">Sin resultados.</div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={cerrarPicker}
                className="px-4 py-2 rounded-xl bg-cyan-700 text-white hover:bg-cyan-600"
              >
                Listo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -------------- Modal (simple) --------------
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
        className="max-w-xl w-full rounded-2xl bg-neutral-900 text-white border border-white/20 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
