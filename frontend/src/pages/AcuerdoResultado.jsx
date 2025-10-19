// src/pages/AcuerdoResultado.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
async function pushNotiFor(uid, payload) {
  const notiRef = push(ref(dbRT, `notificaciones/${uid}`));
  await set(notiRef, {
    id: notiRef.key,
    leido: false,
    fecha: Date.now(),
    ...payload, // { tipo, resumen, href, partidoId? }
  });
}
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

/* --------------------- UI helpers --------------------- */
const avatarFor = (name, url) =>
  url ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "U"
  )}&background=0D8ABC&color=fff&size=160`;

function TeamCard({ title, players = [], selected, onSelect, disabled, highlight }) {
  const names = players.map(
    (p) => `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || p?.email || p?.id || "—"
  );
  const photos = players.map((p) =>
    avatarFor(`${p?.nombre ?? ""} ${p?.apellido ?? ""}`, p?.fotoURL || p?.photoURL)
  );

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-3xl p-6 shadow-lg bg-base-100/90 border border-white/10 transition-all
      ${selected ? "ring-2 ring-primary scale-[1.01]" : "hover:shadow-xl"}
      ${disabled ? "opacity-70" : ""}`}
    >
      <div className="absolute -top-3 -left-3 flex items-center gap-2">
        <span className="badge badge-primary badge-lg">{title}</span>
        {highlight && <span className="badge badge-secondary">tú</span>}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`avatar ${players.length > 1 ? "-space-x-4" : ""}`}>
            {photos.map((src, idx) => (
              <div
                key={idx}
                className="w-16 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"
              >
                <img src={src} alt={names[idx]} />
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{names.join(" / ")}</h3>
            <p className="text-xs opacity-70">
              {players.length === 1 ? "Singles" : players.length === 2 ? "Doubles" : "Equipo"}
            </p>
          </div>
        </div>

        <label
          className={`cursor-pointer flex items-center gap-2 ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input
            type="radio"
            name="winner"
            className="radio radio-primary"
            checked={selected}
            disabled={disabled}
            onChange={() => onSelect?.()}
          />
          <span className="text-sm">Ganador</span>
        </label>
      </div>
    </div>
  );
}

function SetRow({ idx, value, onChange, onRemove, disabled }) {
  const [a, b] = value;
  return (
    <div className="grid grid-cols-12 gap-3 items-center">
      <div className="col-span-2 text-sm opacity-70">Set {idx + 1}</div>
      <div className="col-span-4">
        <input
          type="number"
          min={0}
          max={99}
          value={a}
          onChange={(e) => onChange([parseInt(e.target.value || "0", 10), b])}
          className="input input-bordered w-full text-center"
          placeholder="0"
          disabled={disabled}
        />
      </div>
      <div className="col-span-4">
        <input
          type="number"
          min={0}
          max={99}
          value={b}
          onChange={(e) => onChange([a, parseInt(e.target.value || "0", 10)])}
          className="input input-bordered w-full text-center"
          placeholder="0"
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 flex justify-end">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onRemove}
          aria-label="Eliminar set"
          disabled={disabled}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* --------------------- Página --------------------- */
export default function AcuerdoResultado() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [partido, setPartido] = useState(null);
  const [federados, setFederados] = useState([]);

  // resultado por sets (UI builder) + string
  const [sets, setSets] = useState([[6, 4]]);
  const resultadoString = useMemo(() => sets.map(([a, b]) => `${a}-${b}`).join(", "), [sets]);

  // selección de ganador por equipo (A | B)
  const [winnerSide, setWinnerSide] = useState("A");

  // compat con tu flujo actual
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

      // prefill si hay propuesta/resultado previo
      const existingRes =
        p?.propuestaResultado?.resultado || p?.resultado || "";
      if (existingRes) {
        const parsed = existingRes
          .split(/[, ]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.split("-").map((n) => parseInt(n, 10)))
          .filter((ab) => Array.isArray(ab) && ab.length === 2 && ab.every(Number.isFinite));
        if (parsed.length) setSets(parsed);
      }
      if (Array.isArray(p?.ganadores) && p.ganadores.length) {
        // si ya hay ganador, side lo deducimos luego
      }
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

  // ---- Helpers de datos jugador/teams ----
  const jugadoresIds = useMemo(() => partido?.jugadores || [], [partido]);
  const isAdmin = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return user?.rol === "administrador" || roles?.includes?.("admin") || roles?.includes?.("administrator");
  }, [user]);

  const soyJugador = useMemo(
    () => !!user && jugadoresIds.includes(user?.uid || user?.id),
    [user, jugadoresIds]
  );

  // federados map
  const fedMap = useMemo(() => new Map(federados.map((f) => [f.id, f])), [federados]);

  const resolvePlayer = (idOrObj) => {
    if (idOrObj && typeof idOrObj === "object") return idOrObj;
    const f = fedMap.get(idOrObj);
    return f || { id: idOrObj, nombre: idOrObj };
  };

  // Detectamos equipos de forma robusta:
  // 1) usar partido.equipoA / partido.equipoB (ids u objetos)
  // 2) si no existen, fallback por orden: singles [0] vs [1], dobles [0,1] vs [2,3]
  const equipoAIds = useMemo(() => {
    const eA = partido?.equipoA || partido?.jugadoresA || partido?.equipo1;
    if (Array.isArray(eA) && eA.length) return eA.map((x) => (typeof x === "object" ? x.id : x));
    if (Array.isArray(jugadoresIds) && jugadoresIds.length >= 2) {
      return (partido?.tipoPartido === "dobles" ? jugadoresIds.slice(0, 2) : [jugadoresIds[0]]).filter(Boolean);
    }
    return [];
  }, [partido, jugadoresIds]);

  const equipoBIds = useMemo(() => {
    const eB = partido?.equipoB || partido?.jugadoresB || partido?.equipo2;
    if (Array.isArray(eB) && eB.length) return eB.map((x) => (typeof x === "object" ? x.id : x));
    if (Array.isArray(jugadoresIds) && jugadoresIds.length >= 2) {
      return (partido?.tipoPartido === "dobles" ? jugadoresIds.slice(2, 4) : [jugadoresIds[1]]).filter(Boolean);
    }
    return [];
  }, [partido, jugadoresIds]);

  const equipoA = useMemo(() => equipoAIds.map(resolvePlayer), [equipoAIds, fedMap]);
  const equipoB = useMemo(() => equipoBIds.map(resolvePlayer), [equipoBIds, fedMap]);

  const isInA = useMemo(() => equipoAIds.includes(user?.uid || user?.id), [equipoAIds, user]);
  const isInB = useMemo(() => equipoBIds.includes(user?.uid || user?.id), [equipoBIds, user]);

  const yaFinalizado =
    partido?.estado === "finalizado" ||
    (Array.isArray(partido?.ganadores) && partido.ganadores.length > 0);

  const propuesta = partido?.propuestaResultado || null;
  const propuestaPendiente = !!(propuesta && !yaFinalizado);
  const yoPropuse =
    propuestaPendiente && propuesta.propuestoPor === (user?.uid || user?.id);
  const puedoConfirmar = propuestaPendiente && !yoPropuse && soyJugador;

  const tipoPartido = partido?.tipoPartido || (equipoAIds.length === 2 ? "dobles" : "singles");

  // ganador auto por sets
  const computedWinnerSide = useMemo(() => {
    let a = 0,
      b = 0;
    sets.forEach(([x, y]) => {
      if (x > y) a += 1;
      else if (y > x) b += 1;
    });
    if (a === b) return null;
    return a > b ? "A" : "B";
  }, [sets]);

  // permisos
  const canEdit = (isAdmin || soyJugador) && !yaFinalizado && partido?.estadoResultado !== "en_disputa";
  const editLockedByProposal = yoPropuse && propuestaPendiente; // no editar luego de proponer

  // UI handlers sets
  const addSet = () => setSets((prev) => [...prev, [0, 0]]);
  const updateSet = (i, val) => setSets((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  const removeSet = (i) => setSets((prev) => prev.filter((_, idx) => idx !== i));
  const handleAutoWinner = () => {
    if (computedWinnerSide) setWinnerSide(computedWinnerSide);
  };

  // submit: usa tu flujo (PUT /partidos/:id con propuestaResultado) pero
  // genera: resultadoString y ganadores = equipo ganador (UIDs)
  const onProponer = async () => {
    if (!canEdit || editLockedByProposal) return;

    if (!sets.length) return alert("Agrega al menos 1 set.");
    const valid = sets.every(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    if (!valid) return alert("Revisa los valores de cada set.");

    const winnerIds = winnerSide === "A" ? equipoAIds : equipoBIds;
    if (!winnerIds?.length) return alert("No hay jugadores asignados al equipo ganador.");

    setSubmitting(true);
    setErr("");
    try {
      await fetchJSON(`/partidos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          propuestaResultado: {
            resultado: resultadoString,
            ganadores: winnerIds,
            propuestoPor: user?.uid || user?.id,
            fecha: new Date().toISOString(),
          },
          estadoResultado: "pendiente",
        }),
      });

      // Notificar al/los otros jugadores
      const miUid = user?.uid || user?.id;
      const otros = jugadoresIds.filter((j) => j !== miUid);
      await notificarAcuerdoPartido(otros, id, "Un jugador propuso un resultado. Revisá y confirmá.");

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
        await notificarAcuerdoPartido(jugadoresIds, id, "El resultado del partido fue confirmado.");
      } else {
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
        await notificarAcuerdoPartido(jugadoresIds, id, "Hay una disputa en el resultado del partido.");
      }

      await reload();
      alert(acepta ? "Resultado confirmado. ¡Gracias!" : "Se registró la disputa. Un administrador resolverá.");
    } catch (e) {
      setErr(normalizeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  // carga / errores
  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-200">
        <div className="text-base-content/70">Cargando…</div>
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="max-w-xl mx-auto px-4" style={{ paddingTop: "6rem" }}>
          <h1 className="text-2xl font-bold">Acuerdo de resultado</h1>
          <p className="mt-2 text-error">Error: {err || "Partido no encontrado"}</p>
          <button className="mt-4 btn" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 lg:px-8 w-full pt-24 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">Acuerdo de resultado</h1>
          <Link to="/resultados" className="btn btn-outline btn-sm">Volver</Link>
        </div>

        <div className="mt-2 text-sm">
          <div>
            Partido: <strong>{formatDT(partido.timestamp)}</strong> · {tipoPartido} · Etapa: {partido.etapa || "—"}
          </div>
          <div>
            Estado: <span className="font-semibold">{tituloEstado}</span>
          </div>
        </div>

        {/* Equipos 50/50 */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamCard
            title="Equipo A"
            players={equipoA}
            selected={winnerSide === "A"}
            onSelect={() => setWinnerSide("A")}
            disabled={!canEdit || editLockedByProposal}
            highlight={isInA}
          />
          <TeamCard
            title="Equipo B"
            players={equipoB}
            selected={winnerSide === "B"}
            onSelect={() => setWinnerSide("B")}
            disabled={!canEdit || editLockedByProposal}
            highlight={isInB}
          />
        </section>

        {/* Builder de sets + resumen */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-base-100 p-6 shadow-lg border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Creador de sets</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSets([[6, 4]])}
                  disabled={!canEdit || editLockedByProposal}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addSet}
                  disabled={!canEdit || editLockedByProposal}
                >
                  Añadir set
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 pb-2 border-b mb-3 text-sm opacity-70">
              <div className="col-span-2">#</div>
              <div className="col-span-4 text-center">Equipo A</div>
              <div className="col-span-4 text-center">Equipo B</div>
              <div className="col-span-2" />
            </div>

            <div className="flex flex-col gap-3">
              {sets.map((s, i) => (
                <SetRow
                  key={i}
                  idx={i}
                  value={s}
                  onChange={(val) => updateSet(i, val)}
                  onRemove={() => removeSet(i)}
                  disabled={!canEdit || editLockedByProposal}
                />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1 rounded-3xl bg-base-100 p-6 shadow-lg border">
            <h2 className="text-xl font-semibold mb-3">Resumen</h2>
            <dl className="text-sm space-y-1">
              <div className="flex justify-between">
                <dt className="opacity-70">Tipo</dt>
                <dd className="font-medium capitalize">{tipoPartido}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-70">Sets</dt>
                <dd className="font-medium">{sets.length}</dd>
              </div>
            </dl>

            <div className="divider my-4" />
            <p className="text-sm opacity-70 mb-1">Resultado</p>
            <div className="font-mono text-lg p-3 rounded-xl border bg-base-200">
              {resultadoString || "—"}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleAutoWinner}
                disabled={!computedWinnerSide || !canEdit || editLockedByProposal}
              >
                Auto (por sets)
              </button>
              <span className="text-xs opacity-60">o elige manualmente arriba</span>
            </div>
          </aside>
        </section>

        {/* Mensajes permisos/estados */}
        {!soyJugador && !isAdmin && (
          <div className="mt-6 alert alert-warning">
            <span>Solo jugadores o administradores pueden proponer/confirmar el resultado.</span>
          </div>
        )}
        {partido?.estadoResultado === "en_disputa" && (
          <div className="mt-6 alert alert-error">
            <span>Hay una disputa abierta. Un administrador fijará el resultado final.</span>
          </div>
        )}
        {yaFinalizado && (
          <div className="mt-6 alert alert-success">
            <span>Partido finalizado. No se puede editar.</span>
          </div>
        )}

        {/* Acciones */}
        {!yaFinalizado && (soyJugador || isAdmin) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {!propuestaPendiente && (
              <button
                disabled={!canEdit || editLockedByProposal || submitting}
                onClick={onProponer}
                className="btn btn-primary"
              >
                Proponer resultado
              </button>
            )}

            {puedoConfirmar && (
              <>
                <button
                  disabled={submitting}
                  onClick={() => onConfirmar(true)}
                  className="btn btn-success"
                >
                  Aceptar propuesta
                </button>
                <button
                  disabled={submitting}
                  onClick={() => onConfirmar(false)}
                  className="btn btn-error"
                >
                  Rechazar (escalar a admin)
                </button>
              </>
            )}
          </div>
        )}

        {/* Error toast */}
        {err && (
          <div className="mt-6 rounded-lg border border-red-400/30 bg-red-500/10 text-red-700 px-4 py-3">
            {err}
          </div>
        )}
      </main>

      {/* Modal reutilizable futuro (si precisás picks por jugador) */}
      {/* Conservé tu Modal base, pero no lo uso ahora porque la selección es por equipo */}
    </div>
  );
}

/* Modal simple (lo dejo por si lo necesitás luego) */
function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-w-xl w-full rounded-2xl bg-neutral-900 text-white border border-white/20 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
