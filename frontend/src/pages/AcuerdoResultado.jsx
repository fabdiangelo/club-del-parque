// src/pages/AcuerdoResultado.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthProvider";
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
          <h2 className="text-xl font-semibold m-0 text-neutral-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function TeamCard({
  title,
  players = [],
  selected,
  onSelect,
  disabled,
  highlight,
}) {
  const names = players.map(
    (p) =>
      `${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim() ||
      p?.email ||
      p?.id ||
      "—"
  );
  const photos = players.map((p) =>
    avatarFor(
      `${p?.nombre ?? ""} ${p?.apellido ?? ""}`,
      p?.fotoURL || p?.photoURL
    )
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
            <h3 className="text-xl font-semibold text-neutral-900">
              {names.join(" / ")}
            </h3>
            <p className="text-xs text-neutral-500">
              {players.length === 1
                ? "Singles"
                : players.length === 2
                ? "Doubles"
                : "Equipo"}
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

/* ---- SetRow con intercambio ⇄ y reglas de validación estrictas ---- */
function SetRow({ idx, value, onChange, onRemove, disabled }) {
  const clampInt = (n, lo, hi) =>
    Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : 0));

  const setVal = (patch) => onChange({ ...value, ...patch });

  const a = clampInt(value?.a ?? 0, 0, 7);
  const b = clampInt(value?.b ?? 0, 0, 7);
  const tba = Number.isFinite(value?.tba) ? clampInt(value?.tba, 0, 99) : null;
  const tbb = Number.isFinite(value?.tbb) ? clampInt(value?.tbb, 0, 99) : null;

  // Mostrar TB solo cuando es 7-6 / 6-7
  const is76 = (a === 7 && b === 6) || (a === 6 && b === 7);

  // Intercambiar lados (incluye tiebreak cuando corresponde)
  const swapSides = () => {
    if (disabled) return;
    setVal({ a: b, b: a, tba: is76 ? tbb : null, tbb: is76 ? tba : null });
  };

  // onChange de inputs: clamp inmediato
  const setA = (val) => {
    if (disabled) return;
    const next = clampInt(parseInt(val || "0", 10), 0, 7);
    setVal({ a: next, ...(is76 ? {} : { tba: null, tbb: null }) });
  };
  const setB = (val) => {
    if (disabled) return;
    const next = clampInt(parseInt(val || "0", 10), 0, 7);
    setVal({ b: next, ...(is76 ? {} : { tba: null, tbb: null }) });
  };
  const setTBA = (val) => {
    if (disabled) return;
    setVal({ tba: clampInt(parseInt(val || "0", 10), 0, 99) });
  };
  const setTBB = (val) => {
    if (disabled) return;
    setVal({ tbb: clampInt(parseInt(val || "0", 10), 0, 99) });
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-start">
      <div className="col-span-12 md:col-span-2 text-sm text-neutral-500 pt-2">
        Set {idx + 1}
      </div>

      <div className="col-span-5 md:col-span-4">
        <input
          type="number"
          min={0}
          max={7}
          value={Number.isFinite(a) ? a : ""}
          onChange={(e) => setA(e.target.value)}
          className="input input-bordered w-full text-center"
          placeholder="0"
          disabled={disabled}
        />
      </div>

      <div className="col-span-2 md:col-span-2 flex items-center justify-center">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={swapSides}
          disabled={disabled}
          title="Intercambiar marcadores"
          aria-label="Intercambiar marcadores"
        >
          ⇄
        </button>
      </div>

      <div className="col-span-5 md:col-span-4">
        <input
          type="number"
          min={0}
          max={7}
          value={Number.isFinite(b) ? b : ""}
          onChange={(e) => setB(e.target.value)}
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

      {is76 && (
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
              onChange={(e) => setTBA(e.target.value)}
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
              onChange={(e) => setTBB(e.target.value)}
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

  // Forzar tema blanco (daisyUI)
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
  const [sets, setSets] = useState([{ a: 6, b: 4, tba: null, tbb: null }]);

  // STR resultado estricta: tiebreak solo si 7-6 / 6-7 y ambos TB presentes
  const resultadoString = useMemo(() => {
    return sets
      .map(({ a, b, tba, tbb }) => {
        const base = `${a ?? 0}-${b ?? 0}`;
        const isTB = (a === 7 && b === 6) || (a === 6 && b === 7);
        if (isTB && Number.isFinite(tba) && Number.isFinite(tbb)) {
          return `${base}(${tba}-${tbb})`;
        }
        return base;
      })
      .join(", ");
  }, [sets]);

  const [winnerSide, setWinnerSide] = useState("A");
  const [submitting, setSubmitting] = useState(false);

  // Parsear resultados existentes, aceptando 7-6(7-4)
  const parseResultado = (txt) => {
    if (!txt || typeof txt !== "string") return null;
    const parts = txt
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
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

      // prefill sets desde propuesta/resultado (admite TB)
      const existingRes =
        p?.propuestaResultado?.resultado || p?.resultado || "";
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

  // federados map y helpers de nombre
  const fedMap = useMemo(
    () => new Map(federados.map((f) => [f.id, f])),
    [federados]
  );

  const resolvePlayer = (idOrObj) => {
    if (idOrObj && typeof idOrObj === "object") return idOrObj;
    const f = fedMap.get(idOrObj);
    return f || { id: idOrObj, nombre: idOrObj };
  };

  const displayNameById = (uid) => {
    if (!uid) return "—";
    const f = fedMap.get(uid);
    if (f) {
      const full = `${f?.nombre ?? ""} ${f?.apellido ?? ""}`.trim();
      return full || f.email || uid;
    }
    return uid;
  };

  const equipoAIds = useMemo(() => {
    const eA = partido?.equipoA || partido?.jugadoresA || partido?.equipo1;
    if (Array.isArray(eA) && eA.length)
      return eA.map((x) => (typeof x === "object" ? x.id : x));
    if (Array.isArray(jugadoresIds) && jugadoresIds.length >= 2) {
      return (
        partido?.tipoPartido === "dobles"
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
      return (
        partido?.tipoPartido === "dobles"
          ? jugadoresIds.slice(2, 4)
          : [jugadoresIds[1]]
      ).filter(Boolean);
    }
    return [];
  }, [partido, jugadoresIds]);

  const equipoA = useMemo(
    () => equipoAIds.map(resolvePlayer),
    [equipoAIds, fedMap]
  );
  const equipoB = useMemo(
    () => equipoBIds.map(resolvePlayer),
    [equipoBIds, fedMap]
  );

  const isInA = useMemo(
    () => equipoAIds.includes(user?.uid || user?.id),
    [equipoAIds, user]
  );
  const isInB = useMemo(
    () => equipoBIds.includes(user?.uid || user?.id),
    [equipoBIds, user]
  );

  const yaFinalizado =
    partido?.estado === "finalizado" ||
    (Array.isArray(partido?.ganadores) && partido.ganadores.length > 0);

  const propuesta = partido?.propuestaResultado || null;
  const propuestaPendiente = !!(propuesta && !yaFinalizado);
  const yoPropuse =
    propuestaPendiente && propuesta.propuestoPor === (user?.uid || user?.id);

  // --- NUEVO: lado (A/B) del usuario y del proponente
  const sideOf = useCallback(
    (uid) => {
      if (!uid) return null;
      if (equipoAIds.includes(uid)) return "A";
      if (equipoBIds.includes(uid)) return "B";
      return null;
    },
    [equipoAIds, equipoBIds]
  );

  const myUid = user?.uid || user?.id;
  const proponenteUid = propuesta?.propuestoPor || null;
  const mySide = sideOf(myUid);
  const proponenteSide = sideOf(proponenteUid);
  const soyDelEquipoOpuesto =
    Boolean(propuestaPendiente) &&
    Boolean(mySide) &&
    Boolean(proponenteSide) &&
    mySide !== proponenteSide;

  // Solo confirma un jugador del equipo contrario
  const puedoConfirmar =
    propuestaPendiente && soyJugador && soyDelEquipoOpuesto;

  const tipoPartido =
    partido?.tipoPartido || (equipoAIds.length === 2 ? "dobles" : "singles");

  // ganador auto por sets
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

  // ======== PERMISOS / READ-ONLY ========
  const canEditBase =
    (isAdmin || soyJugador) &&
    !yaFinalizado &&
    partido?.estadoResultado !== "en_disputa";

  // Con propuesta pendiente, nadie edita (solo confirmar/rechazar si corresponde)
  const editingEnabled = canEditBase && !propuestaPendiente;

  // Al cargar, si hay propuesta y estoy en flujo de confirmación, setear ganador visual desde la propuesta
  useEffect(() => {
    if (propuestaPendiente && puedoConfirmar) {
      const propWin = propuesta?.ganadores || [];
      const winSide = propWin.some((id) => equipoAIds.includes(id)) ? "A" : "B";
      setWinnerSide(winSide);
      // sets ya se llenan desde propuesta.resultado en reload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    propuestaPendiente,
    puedoConfirmar,
    JSON.stringify(propuesta?.ganadores),
  ]);

  // Validación estricta de sets
  const validateSets = (arr) => {
    if (!arr.length) return "Agrega al menos 1 set.";
    for (const { a, b, tba, tbb } of arr) {
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return "Revisa los valores de cada set.";
      }
      if (a < 0 || b < 0 || a > 7 || b > 7) {
        return "Los games deben estar entre 0 y 7.";
      }
      if (a === b) {
        return "Un set no puede terminar empatado.";
      }

      const w = Math.max(a, b);
      const l = Math.min(a, b);

      if (!(w === 6 || w === 7)) {
        return "El ganador del set debe tener 6 o 7 games.";
      }

      if (w === 6) {
        if (!(l >= 0 && l <= 4)) {
          return "Si el ganador tiene 6, el perdedor debe tener entre 0 y 4.";
        }
        if (Number.isFinite(tba) || Number.isFinite(tbb)) {
          return "El tiebreak solo corresponde en 7-6/6-7.";
        }
      }

      if (w === 7) {
        if (l !== 6) {
          return "Si el ganador tiene 7, el perdedor debe tener 6 (7-6).";
        }
        if (!(Number.isFinite(tba) && Number.isFinite(tbb))) {
          return "En 7-6 se requiere tiebreak (A y B).";
        }
      }
    }
    return null;
  };

  // UI handlers sets
  const addSet = () =>
    editingEnabled &&
    setSets((prev) => [...prev, { a: 0, b: 0, tba: null, tbb: null }]);
  const updateSet = (i, patch) =>
    editingEnabled &&
    setSets((prev) => prev.map((s, idx) => (idx === i ? patch : s)));
  const removeSet = (i) =>
    editingEnabled && setSets((prev) => prev.filter((_, idx) => idx !== i));
  const handleAutoWinner = () => {
    if (editingEnabled && computedWinnerSide) setWinnerSide(computedWinnerSide);
  };

  // submit
  const onProponer = async () => {
    if (!editingEnabled) return;

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
    // Solo si soy del equipo contrario y NO está en disputa
    if (!puedoConfirmar || partido?.estadoResultado === "en_disputa") return;

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
        const mailDelUsuario =
          user?.email ||
          user?.correo ||
          user?.mail ||
          (() => {
            const f = federados?.find?.(
              (x) => x.id === (user?.uid || user?.id)
            );
            return f?.email || f?.mail || "@desconocido";
          })();

        await fetchJSON(`/reportes`, {
          method: "POST",
          body: JSON.stringify({
            motivo: "disputa_resultado",
            tipo: "disputa_resultado",
            descripcion: `Discrepancia en resultado reportada por ${mailDelUsuario}`,
            partidoId: id,
            mailUsuario: mailDelUsuario,
            fecha: new Date().toISOString(),
            leido: false,
            estado: "pendiente",
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
      <div className="min-h-screen bg-white text-neutral-900">
        <Navbar />
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

  const statusKey = yaFinalizado
    ? "finalizado"
    : partido?.estadoResultado === "en_disputa"
    ? "disputa"
    : propuestaPendiente
    ? "por_confirmar"
    : "pendiente";

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar />

      {/* HERO */}
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
        {/* Aviso de solo lectura cuando estoy confirmando/rechazando */}
        {puedoConfirmar && (
          <div className="mt-6 alert alert-info">
            <span>
              Estás revisando una <strong>propuesta de resultado</strong> hecha
              por el equipo rival. Podés aceptarla o rechazarla.
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
        {propuestaPendiente && !puedoConfirmar && (
          <div className="mt-6 alert">
            <span>
              Hay una propuesta pendiente. Solo un jugador del{" "}
              <strong>equipo contrario</strong> puede confirmarla o rechazarla.
            </span>
          </div>
        )}

        {/* Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamCard
            title="Equipo A"
            players={equipoA}
            selected={winnerSide === "A"}
            onSelect={() => editingEnabled && setWinnerSide("A")}
            disabled={!editingEnabled}
            highlight={isInA}
          />
          <TeamCard
            title="Equipo B"
            players={equipoB}
            selected={winnerSide === "B"}
            onSelect={() => editingEnabled && setWinnerSide("B")}
            disabled={!editingEnabled}
            highlight={isInB}
          />
        </div>

        {/* Builder + resumen */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <SectionCard
            title="Creador de sets"
            subtitle={
              editingEnabled
                ? "Cargá los games de cada set"
                : "Vista de la propuesta"
            }
            right={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() =>
                    editingEnabled &&
                    setSets([{ a: 6, b: 4, tba: null, tbb: null }])
                  }
                  disabled={!editingEnabled}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    editingEnabled &&
                    setSets((prev) => [
                      ...prev,
                      { a: 6, b: 4, tba: null, tbb: null },
                    ])
                  }
                  disabled={!editingEnabled}
                >
                  Añadir set
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-12 gap-3 pb-2 border-b border-neutral-200 mb-3 text-sm text-neutral-500">
              <div className="col-span-2">#</div>
              <div className="col-span-4 text-center">Equipo A</div>
              <div className="col-span-2" />
              <div className="col-span-4 text-center">Equipo B</div>
            </div>
            <div className="flex flex-col gap-3">
              {sets.map((s, i) => (
                <SetRow
                  key={i}
                  idx={i}
                  value={s}
                  onChange={(val) => updateSet(i, val)}
                  onRemove={() => removeSet(i)}
                  disabled={!editingEnabled}
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
                {propuestaPendiente && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Propuesto por</dt>
                      <dd className="font-medium">
                        {displayNameById(propuesta?.propuestoPor)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Fecha propuesta</dt>
                      <dd className="font-medium">
                        {formatDT(propuesta?.fecha)}
                      </dd>
                    </div>
                  </>
                )}
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
                  disabled={!computedWinnerSide || !editingEnabled}
                >
                  Auto (por sets)
                </button>
                <span className="text-xs text-neutral-500">
                  {editingEnabled
                    ? "o elige manualmente arriba"
                    : "Modo lectura"}
                </span>
              </div>
            </SectionCard>
          </aside>
        </div>

        {/* Acciones */}
        {!yaFinalizado && (soyJugador || isAdmin) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {/* Proponer solo si NO hay propuesta pendiente */}
            {!propuestaPendiente && (
              <button
                disabled={!editingEnabled || submitting}
                onClick={onProponer}
                className="btn btn-primary"
              >
                Proponer resultado
              </button>
            )}

            {/* Confirmación / Rechazo: solo equipo contrario y NO en disputa */}
            {puedoConfirmar && partido?.estadoResultado !== "en_disputa" && (
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
