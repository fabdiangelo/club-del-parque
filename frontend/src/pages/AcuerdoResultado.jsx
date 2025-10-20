// src/pages/AcuerdoResultado.jsx (white theme forced + tie-break support)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco";
import { useAuth } from "../contexts/AuthProvider";

// 🔔 Realtime DB para notificaciones
import { ref, push, set } from "firebase/database";
import { dbRT } from "../utils/FirebaseService.js";

/* ---------------- Utilidades de red y formato ---------------- */
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

function StatusPill({ state }) {
  const map = {
    finalizado: { cls: "badge-success", text: "Finalizado" },
    disputa: { cls: "badge-error", text: "En disputa" },
    pendiente: { cls: "badge-ghost", text: "Pendiente" },
    por_confirmar: { cls: "badge-warning", text: "Esperando confirmación" },
  };
  const m = map[state] || map.pendiente;
  return <span className={`badge ${m.cls} gap-1`}>{m.text}</span>;
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <section className="rounded-3xl bg-white backdrop-blur shadow-lg border border-neutral-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold m-0 text-neutral-900">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function TeamCard({ title, players = [], selected, onSelect, disabled, highlight }) {
  const names = players.map(
    (p) => `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() || p?.email || p?.id || "—"
  );
  const photos = players.map((p) =>
    avatarFor(`${p?.nombre ?? ""} ${p?.apellido ?? ""}`, p?.fotoURL || p?.photoURL)
  );

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-3xl p-6 shadow-lg bg-white border border-neutral-200 transition-all duration-300 ${
        selected ? "ring-2 ring-primary scale-[1.01]" : "hover:shadow-xl"
      } ${disabled ? "opacity-70" : ""}`}
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
                className="w-16 rounded-full ring ring-primary ring-offset-2 ring-offset-white"
              >
                <img src={src} alt={names[idx]} />
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">{names.join(" / ")}</h3>
            <p className="text-xs text-neutral-500">
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
          <span className="text-sm text-neutral-700">Ganador</span>
        </label>
      </div>
    </div>
  );
}

/* ---- SetRow con tie-break opcional ---- */
function SetRow({ idx, value, onChange, onRemove, disabled }) {
  const { a, b, tba, tbb } = value;

  // Un set requiere tiebreak si termina 7-6 o 6-7 (o, en general, >=6 y diferencia de 1)
  const tbNeeded =
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    (a >= 6 || b >= 6) &&
    Math.abs(a - b) === 1;

  const setVal = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-12 gap-3 items-start">
      <div className="col-span-12 md:col-span-2 text-sm text-neutral-500 pt-2">
        Set {idx + 1}
      </div>

      <div className="col-span-6 md:col-span-4">
        <input
          type="number"
          min={0}
          max={99}
          value={Number.isFinite(a) ? a : ""}
          onChange={(e) => setVal({ a: parseInt(e.target.value || "0", 10) })}
          className="input input-bordered w-full text-center"
          placeholder="0"
          disabled={disabled}
        />
      </div>

      <div className="col-span-6 md:col-span-4">
        <input
          type="number"
          min={0}
          max={99}
          value={Number.isFinite(b) ? b : ""}
          onChange={(e) => setVal({ b: parseInt(e.target.value || "0", 10) })}
          className="input input-bordered w-full text-center"
          placeholder="0"
          disabled={disabled}
        />
      </div>

      <div className="col-span-12 md:col-span-2 flex justify-end">
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

      {tbNeeded && (
        <div className="col-span-12 grid grid-cols-12 gap-3 items-center -mt-1">
          <div className="col-span-12 md:col-span-2 text-xs text-neutral-500">
            Tie-break
          </div>
          <div className="col-span-6 md:col-span-4">
            <input
              type="number"
              min={0}
              max={99}
              value={Number.isFinite(tba) ? tba : ""}
              onChange={(e) => setVal({ tba: parseInt(e.target.value || "0", 10) })}
              className="input input-bordered w-full text-center"
              placeholder="A"
              disabled={disabled}
            />
          </div>
          <div className="col-span-6 md:col-span-4">
            <input
              type="number"
              min={0}
              max={99}
              value={Number.isFinite(tbb) ? tbb : ""}
              onChange={(e) => setVal({ tbb: parseInt(e.target.value || "0", 10) })}
              className="input input-bordered w-full text-center"
              placeholder="B"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------- Página --------------------- */
export default function AcuerdoResultado() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Forzar tema blanco (daisyUI) mientras este componente esté montado
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.add("bg-white");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("bg-white");
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [partido, setPartido] = useState(null);
  const [federados, setFederados] = useState([]);

  // resultado por sets (con tiebreak)
  // Forma: { a: gamesA, b: gamesB, tba: tieA (opcional), tbb: tieB (opcional) }
  const [sets, setSets] = useState([{ a: 6, b: 4, tba: null, tbb: null }]);

  // String del resultado, ej: "6-4, 7-6(7-4)"
  const resultadoString = useMemo(() => {
    return sets
      .map(({ a, b, tba, tbb }) => {
        const tbNeeded =
          Number.isFinite(a) &&
          Number.isFinite(b) &&
          (a >= 6 || b >= 6) &&
          Math.abs(a - b) === 1;
        const base = `${a ?? 0}-${b ?? 0}`;
        if (tbNeeded && Number.isFinite(tba) && Number.isFinite(tbb)) {
          return `${base}(${tba}-${tbb})`;
        }
        return base;
      })
      .join(", ");
  }, [sets]);

  // selección de ganador por equipo (A | B)
  const [winnerSide, setWinnerSide] = useState("A");

  // compat con tu flujo actual
  const [submitting, setSubmitting] = useState(false);

  // Parsear resultados existentes, aceptando 7-6(7-4)
  const parseResultado = (txt) => {
    if (!txt || typeof txt !== "string") return null;
    const parts = txt.split(",").map((s) => s.trim()).filter(Boolean);
    const re = /^(\d+)[-–](\d+)(?:\((\d+)[-–](\d+)\))?$/;
    const out = [];
    for (const p of parts) {
      const m = p.match(re);
      if (!m) return null;
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const tba = m[3] ? parseInt(m[3], 10) : null;
      const tbb = m[4] ? parseInt(m[4], 10) : null;
      out.push({ a, b, tba, tbb });
    }
    return out;
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const p = await fetchJSONorNull(`/partidos/${id}`);
      if (!p) throw new Error("Partido no encontrado");
      const fs = await fetchJSON(`/usuarios/federados`);
      setPartido(p);
      setFederados(Array.isArray(fs) ? fs : []);

      // prefill si hay propuesta/resultado previo (admite tie-break)
      const existingRes = p?.propuestaResultado?.resultado || p?.resultado || "";
      const parsed = parseResultado(existingRes);
      if (parsed && parsed.length) setSets(parsed);
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
    return (
      user?.rol === "administrador" ||
      roles?.includes?.("admin") ||
      roles?.includes?.("administrator")
    );
  }, [user]);

  const soyJugador = useMemo(
    () => !!user && jugadoresIds.includes(user?.uid || user?.id),
    [user, jugadoresIds]
  );

  // federados map
  const fedMap = useMemo(
    () => new Map(federados.map((f) => [f.id, f])),
    [federados]
  );

  const resolvePlayer = (idOrObj) => {
    if (idOrObj && typeof idOrObj === "object") return idOrObj;
    const f = fedMap.get(idOrObj);
    return f || { id: idOrObj, nombre: idOrObj };
  };

  // Detectamos equipos de forma robusta
  const equipoAIds = useMemo(() => {
    const eA = partido?.equipoA || partido?.jugadoresA || partido?.equipo1;
    if (Array.isArray(eA) && eA.length)
      return eA.map((x) => (typeof x === "object" ? x.id : x));
    if (Array.isArray(jugadoresIds) && jugadoresIds.length >= 2) {
      return (partido?.tipoPartido === "dobles"
        ? jugadoresIds.slice(0, 2)
        : [jugadoresIds[0]]
      ).filter(Boolean);
    }
    return [];
  }, [partido, jugadoresIds]);

  const equipoBIds = useMemo(() => {
    const eB = partido?.equipoB || partido?.jugadoresB || partido?.equipo2;
    if (Array.isArray(eB) && eB.length)
      return eB.map((x) => (typeof x === "object" ? x.id : x));
    if (Array.isArray(jugadoresIds) && jugadoresIds.length >= 2) {
      return (partido?.tipoPartido === "dobles"
        ? jugadoresIds.slice(2, 4)
        : [jugadoresIds[1]]
      ).filter(Boolean);
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
  const yoPropuse = propuestaPendiente && propuesta.propuestoPor === (user?.uid || user?.id);
  const puedoConfirmar = propuestaPendiente && !yoPropuse && soyJugador;

  const tipoPartido = partido?.tipoPartido || (equipoAIds.length === 2 ? "dobles" : "singles");

  // ganador auto por sets (según games del set)
  const computedWinnerSide = useMemo(() => {
    let aw = 0,
      bw = 0;
    sets.forEach(({ a, b }) => {
      if (a > b) aw += 1;
      else if (b > a) bw += 1;
    });
    if (aw === bw) return null;
    return aw > bw ? "A" : "B";
  }, [sets]);

  // permisos
  const canEdit =
    (isAdmin || soyJugador) &&
    !yaFinalizado &&
    partido?.estadoResultado !== "en_disputa";
  const editLockedByProposal = yoPropuse && propuestaPendiente; // no editar luego de proponer

  // UI handlers sets
  const addSet = () => setSets((prev) => [...prev, { a: 0, b: 0, tba: null, tbb: null }]);
  const updateSet = (i, patch) =>
    setSets((prev) => prev.map((s, idx) => (idx === i ? patch : s)));
  const removeSet = (i) =>
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  const handleAutoWinner = () => {
    if (computedWinnerSide) setWinnerSide(computedWinnerSide);
  };

  // Validación de sets + tiebreak
  const validateSets = (arr) => {
    if (!arr.length) return "Agrega al menos 1 set.";
    for (const { a, b, tba, tbb } of arr) {
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return "Revisa los valores de cada set.";
      }
      const tbNeeded =
        (a >= 6 || b >= 6) && Math.abs(a - b) === 1; // 7-6 o 6-7 típicamente
      if (tbNeeded && !(Number.isFinite(tba) && Number.isFinite(tbb))) {
        return "Completa los puntos del tie-break en los sets 7-6 / 6-7.";
      }
    }
    return null;
  };

  // submit
  const onProponer = async () => {
    if (!canEdit || editLockedByProposal) return;

    const errSets = validateSets(sets);
    if (errSets) return alert(errSets);

    const winnerIds = winnerSide === "A" ? equipoAIds : equipoBIds;
    if (!winnerIds?.length)
      return alert("No hay jugadores asignados al equipo ganador.");

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
      await notificarAcuerdoPartido(
        jugadoresIds,
        id,
        "El resultado del partido fue confirmado."
      );
    } else {
      // Registrar un reporte de disputa
      await fetchJSON(`/reportes`, {
        method: "POST",
        body: JSON.stringify({
          motivo: "disputa_resultado",
          descripcion: "Discrepancia en resultado reportada por jugador",
          // extras opcionales
          tipo: "disputa_resultado",
          partidoID: id,
          jugadores: jugadoresIds,
          mailUsuario: user?.email ?? null,
          fecha: new Date().toISOString(),
          estado: "pendiente",
          leido: false,
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


  /* --------------------- Render --------------------- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-neutral-600">Cargando…</div>
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="min-h-screen bg-base-200">
        <NavbarBlanco />
        <div className="max-w-xl mx-auto px-4" style={{ paddingTop: "6rem" }}>
          <h1 className="text-2xl font-bold">Acuerdo de resultado</h1>
          <p className="mt-2 text-red-600">
            Error: {err || "Partido no encontrado"}
          </p>
          <button className="mt-4 btn btn-outline" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const statusKey =
    yaFinalizado
      ? "finalizado"
      : partido?.estadoResultado === "en_disputa"
      ? "disputa"
      : propuestaPendiente
      ? "por_confirmar"
      : "pendiente";

  return (
    <div className="min-h-screen bg-base-200">
      <NavbarBlanco />
      <main className="mx-auto max-w-6xl px-6 lg:px-8 w-full pt-24 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">Acuerdo de resultado</h1>
          <Link to="/resultados" className="btn btn-outline btn-sm">Volver</Link>
        </div>

      {/* HERO / encabezado con imagen tenue como en Homepage */}
      <header
        className="relative w-full"
        style={{
          backgroundImage: "url('/fondohome.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-16">
          <div className="flex flex-wrap items-center justify-between gap-4 text-white">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/80">
                Resultados
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Acuerdo de resultado
              </h1>
              <p className="text-white/80 mt-2 text-sm">
                Partido: <strong>{formatDT(partido.timestamp)}</strong> ·{" "}
                {tipoPartido} · Etapa: {partido.etapa || "—"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill state={statusKey} />
              <Link to="/resultados" className="btn btn-outline btn-sm">
                Volver
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 w-full -mt-8 pb-24">
        {/* Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Builder + resumen */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <SectionCard
            title="Creador de sets"
            subtitle="Cargá los games de cada set"
            right={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSets([{ a: 6, b: 4, tba: null, tbb: null }])}
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
            }
          >
            <div className="grid grid-cols-12 gap-3 pb-2 border-b border-neutral-200 mb-3 text-sm text-neutral-500">
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
          </SectionCard>

          <aside className="lg:col-span-1">
            <SectionCard title="Resumen" subtitle="Vista rápida del resultado">
              <dl className="text-sm space-y-2">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Tipo</dt>
                  <dd className="font-medium capitalize">{tipoPartido}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Sets</dt>
                  <dd className="font-medium">{sets.length}</dd>
                </div>
              </dl>

              <div className="divider my-4" />
              <p className="text-sm text-neutral-500 mb-1">Resultado</p>
              <div className="font-mono text-lg p-3 rounded-xl border border-neutral-200 bg-neutral-50">
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
                <span className="text-xs text-neutral-500">
                  o elige manualmente arriba
                </span>
              </div>
            </SectionCard>
          </aside>
        </div>

        {/* Mensajes de estado/permisos */}
        {!soyJugador && !isAdmin && (
          <div className="mt-6 alert alert-warning">
            <span>
              Solo jugadores o administradores pueden proponer/confirmar el
              resultado.
            </span>
          </div>
        )}
        {partido?.estadoResultado === "en_disputa" && (
          <div className="mt-6 alert alert-error">
            <span>
              Hay una disputa abierta. Un administrador fijará el resultado
              final.
            </span>
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
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-3">
            {err}
          </div>
        )}
      </main>
    </div>
  );
}

/* Modal simple por si hace falta más adelante */
export function Modal({ children, onClose }) {
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
        className="max-w-xl w-full rounded-2xl bg-white text-neutral-900 border border-neutral-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
