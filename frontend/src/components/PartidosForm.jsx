// src/components/PartidoForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { PlayerPickerModal } from "./PlayerPickerModal";

/* ---------- helpers locales (solo lo que usa el form) ---------- */
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
const normID = (v) => String(v ?? "").trim();
const knownIdSet = (feds = []) => new Set((feds || []).map((f) => normID(f.id)));
const filterKnown = (arr = [], set) => (arr || []).map(normID).filter((id) => set.has(id));
const uniq = (arr = []) => Array.from(new Set(arr));
const limitPlayers = (arr = [], n) => uniq(arr).slice(0, n);
const datasetsToOptions = (list = []) =>
  list.map((t) => (
    <option key={t.id} value={t.id}>
      {t.nombre || t.id}
    </option>
  ));
const arraysEqual = (a = [], b = []) =>
  a.length === b.length && a.every((x) => b.includes(x));

const emptyPartido = {
  id: undefined,
  timestamp: new Date().toISOString(),
  estado: "programado",
  tipoPartido: "singles",
  temporadaID: "",
  canchaID: "",
  etapa: "",
  jugadores: [],
  equipoLocal: [],
  equipoVisitante: [],
  ganadores: [],
  resultado: "",
  // NUEVO: abandono
  abandono: "ninguno", // ninguno | uno | ambos
  abandonoJugador: "", // id del jugador si abandono === "uno"
};

/* ------------------ helpers de género ------------------ */
const normalizeGender = (g) => {
  const v = String(g || "").toLowerCase();
  if (["m", "male", "masculino", "hombre"].includes(v)) return "male";
  if (["f", "female", "femenino", "mujer"].includes(v)) return "female";
  return "unknown";
};
const federadoById = (arr, id) => arr.find((f) => normID(f.id) === normID(id));
const genderOf = (arr, id) =>
  normalizeGender(
    federadoById(arr, id)?.genero ?? federadoById(arr, id)?.sexo
  );

/** Devuelve el “tipo” de equipo: 'male' | 'female' | 'mixed' | 'unknown' */
function teamType(teamIds = [], federados = []) {
  const genders = teamIds.map((id) => genderOf(federados, id));
  const set = new Set(genders.filter((g) => g !== "unknown"));
  if (set.size === 0) return "unknown";
  if (set.size === 1) return [...set][0]; // male o female
  return "mixed";
}

/** Forma los equipos para validar (según selección real de equipos) */
function teamsForValidation(draft) {
  return {
    local: draft.equipoLocal || [],
    visitante: draft.equipoVisitante || [],
  };
}

export default function PartidoForm({ value, onCancel, onSubmit, datasets }) {
  const [draft, setDraft] = useState(() => ({
    ...emptyPartido,
    ...(value || {}),
  }));
  const { temporadas, canchas, federados } =
    datasets || { temporadas: [], canchas: [], federados: [] };

  const singles = draft.tipoPartido === "singles";
  const requiredPlayers = singles ? 2 : 4;

  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);

  /* --------- normalizaciones por cambio de tipo --------- */
  useEffect(() => {
    setDraft((d) => {
      const next = { ...d };
      const isSingles = next.tipoPartido === "singles";

      // Limitar cantidad total de jugadores
      if (isSingles && next.jugadores.length > 2)
        next.jugadores = next.jugadores.slice(0, 2);
      if (!isSingles && next.jugadores.length > 4)
        next.jugadores = next.jugadores.slice(0, 4);

      // Limpiar equipos si el conteo no es válido para el tipo actual
      const maxPerTeam = isSingles ? 1 : 2;
      next.equipoLocal = (next.equipoLocal || []).slice(0, maxPerTeam);
      next.equipoVisitante = (next.equipoVisitante || []).slice(0, maxPerTeam);

      // Winners: singles máx 1; dobles máx 2
      const maxWinners = isSingles ? 1 : 2;
      next.ganadores = (next.ganadores || [])
        .filter((id) => next.jugadores.includes(id))
        .slice(0, maxWinners);

      return next;
    });
  }, [draft.tipoPartido]);

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const playerLabel = (id) => {
    const u = federadoById(federados, id) || { nombre: id, apellido: "" };
    return `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || u.email || id;
  };

  // Limpieza de IDs inexistentes / desnormalizados cuando cambian federados
  useEffect(() => {
    const kset = knownIdSet(federados);
    setDraft((d) => {
      const next = { ...d };
      // jugadores válidos
      next.jugadores = filterKnown(next.jugadores, kset);
      // equipos deben pertenecer a jugadores válidos
      next.equipoLocal = filterKnown(next.equipoLocal, kset).filter((id) =>
        next.jugadores.includes(id)
      );
      next.equipoVisitante = filterKnown(next.equipoVisitante, kset).filter((id) =>
        next.jugadores.includes(id)
      );
      // ganadores válidos y dentro de jugadores
      next.ganadores = filterKnown(next.ganadores, kset).filter((id) =>
        next.jugadores.includes(id)
      );
      // abandonoJugador debe ser un jugador válido
      if (!next.jugadores.includes(next.abandonoJugador)) {
        next.abandonoJugador = "";
      }
      return next;
    });
  }, [federados]);

  /* ---------- reglas de género y estructura de equipos ---------- */
  const genderErrors = useMemo(() => {
    const errs = [];
    const { local, visitante } = teamsForValidation(draft);

    // Estructura estricta de equipos
    if (singles) {
      if (local.length !== 1 || visitante.length !== 1) {
        errs.push("En singles debe haber 1 jugador por lado (1 vs 1).");
      } else {
        const g1 = genderOf(federados, local[0]);
        const g2 = genderOf(federados, visitante[0]);
        if (g1 !== "unknown" && g2 !== "unknown" && g1 !== g2) {
          errs.push(
            "En singles no se permiten enfrentamientos de distinto género (M vs F)."
          );
        }
      }
    } else {
      if (local.length !== 2 || visitante.length !== 2) {
        errs.push("En dobles debe haber 2 jugadores por lado (2 vs 2).");
      } else {
        const localType = teamType(local, federados); // 'male' | 'female' | 'mixed' | 'unknown'
        const visitType = teamType(visitante, federados);
        const bothKnown = localType !== "unknown" && visitType !== "unknown";
        const bothMixed = localType === "mixed" && visitType === "mixed";
        const bothSameSex =
          (localType === "male" && visitType === "male") ||
          (localType === "female" && visitType === "female");
        if (bothKnown && !(bothMixed || bothSameSex)) {
          errs.push(
            "En dobles solo se permite mixto vs mixto o mismo sexo vs mismo sexo."
          );
        }
      }
    }

    // Hint si hay unknown (no bloquea)
    const anyUnknown = (draft.jugadores || []).some(
      (id) => genderOf(federados, id) === "unknown"
    );
    if (anyUnknown) {
      errs.push(
        "Algunos jugadores no tienen género definido; completá ese dato para validar correctamente."
      );
    }
    return errs;
  }, [draft, federados, singles]);

  const subset = (arr, sup) => (arr || []).every((id) => sup.includes(id));

  // Reglas de ganadores
  const winnersOK = useMemo(() => {
    const { equipoLocal, equipoVisitante, ganadores } = draft;
    if (singles) {
      return (
        ganadores.length === 1 &&
        (ganadores[0] === equipoLocal[0] || ganadores[0] === equipoVisitante[0])
      );
    }
    // dobles: debe ser exactamente el equipo local o el visitante
    if (ganadores.length !== 2) return false;
    const g = uniq(ganadores);
    return (
      arraysEqual(g, uniq(equipoLocal)) || arraysEqual(g, uniq(equipoVisitante))
    );
  }, [draft, singles]);

  const baseValid =
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
    winnersOK;

  const hasHardGenderViolation = genderErrors.some(
    (e) =>
      e.toLowerCase().includes("no se permiten") ||
      e.toLowerCase().includes("solo se permite") ||
      e.toLowerCase().includes("debe haber")
  );

  const formValid = baseValid && !hasHardGenderViolation;

  /* ------------- exclusividad de equipos y límites ------------- */
  const maxPerTeam = singles ? 1 : 2;
  const toggleInLocal = (id) =>
    setDraft((d) => {
      const nid = normID(id);
      const inLocal = d.equipoLocal.includes(nid);
      const inVisit = d.equipoVisitante.includes(nid);
      let equipoLocal = [...d.equipoLocal];
      let equipoVisitante = inVisit
        ? d.equipoVisitante.filter((x) => x !== nid)
        : [...d.equipoVisitante];

      if (inLocal) {
        equipoLocal = equipoLocal.filter((x) => x !== nid);
      } else {
        if (equipoLocal.length >= maxPerTeam) return d; // no supera cupo
        equipoLocal.push(nid);
      }
      return { ...d, equipoLocal, equipoVisitante };
    });

  const toggleInVisit = (id) =>
    setDraft((d) => {
      const nid = normID(id);
      const inLocal = d.equipoLocal.includes(nid);
      const inVisit = d.equipoVisitante.includes(nid);
      let equipoVisitante = [...d.equipoVisitante];
      let equipoLocal = inLocal ? d.equipoLocal.filter((x) => x !== nid) : [...d.equipoLocal];

      if (inVisit) {
        equipoVisitante = equipoVisitante.filter((x) => x !== nid);
      } else {
        if (equipoVisitante.length >= maxPerTeam) return d;
        equipoVisitante.push(nid);
      }
      return { ...d, equipoLocal, equipoVisitante };
    });

  /* ------------- submit ------------- */
  const submit = (e) => {
    e.preventDefault();
    if (!formValid) return;

    // Anotar abandono en resultado para persistir sin tocar backend
    let resultado = draft.resultado || "";
    if (draft.abandono === "ambos") {
      if (!/abandono/i.test(resultado)) {
        resultado = resultado ? `${resultado} · Doble abandono` : "Doble abandono";
      }
    } else if (draft.abandono === "uno" && draft.abandonoJugador) {
      const lbl = playerLabel(draft.abandonoJugador);
      if (!/abandono/i.test(resultado)) {
        resultado = resultado ? `${resultado} · Abandono: ${lbl}` : `Abandono: ${lbl}`;
      }
    }

    // Normalizar IDs antes de enviar (solo relacionado al problema de IDs)
    const clean = (arr = []) => uniq(arr.map(normID));
    onSubmit?.({
      ...draft,
      jugadores: clean(draft.jugadores),
      equipoLocal: clean(draft.equipoLocal),
      equipoVisitante: clean(draft.equipoVisitante),
      ganadores: clean(draft.ganadores),
      abandonoJugador:
        draft.abandono === "uno" ? normID(draft.abandonoJugador) : "",
      resultado,
    });
  };

  const selectedChips = (ids = []) =>
    ids.map((id) => (
      <span
        key={id}
        className="px-2 py-0.5 rounded-full text-xs border bg-white/10 text-white border-white/20"
        title={id}
      >
        {playerLabel(id)}
      </span>
    ));

  return (
    <>
      {/* Contenedor scrollable (independiente del modal) */}
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <form onSubmit={submit} className="p-6 space-y-6">
          {/* Header actions */}
          <div className="flex items-start justify-between sticky top-0 bg-neutral-900/85 backdrop-blur px-0 py-3 -mx-0">
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
                title={formValid ? "Corregí los errores para guardar" : "Corregí los errores para guardar"}
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Mensajes de validación de género / estructura */}
          {genderErrors.length > 0 && (
            <div className="rounded-xl border border-white/20 bg-neutral-800/60 p-3 text-sm space-y-1">
              {genderErrors.map((msg, i) => (
                <div
                  key={i}
                  className={`${
                    msg.toLowerCase().includes("no se permiten") ||
                    msg.toLowerCase().includes("solo se permite") ||
                    msg.toLowerCase().includes("debe haber")
                      ? "text-red-300"
                      : "text-amber-300"
                  }`}
                >
                  • {msg}
                </div>
              ))}
            </div>
          )}

          {/* Grid principal */}
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

            {/* Jugadores */}
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
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          jugadores: [],
                          equipoLocal: [],
                          equipoVisitante: [],
                          ganadores: [],
                        }))
                      }
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
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleInLocal(id)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        on
                          ? "bg-cyan-700 text-white border-cyan-500"
                          : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
                      }`}
                    >
                      {playerLabel(id)}
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
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleInVisit(id)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        on
                          ? "bg-cyan-700 text-white border-cyan-500"
                          : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
                      }`}
                    >
                      {playerLabel(id)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ganadores */}
            <div className="space-y-2">
              <label className="block text-sm">
                Ganadores ({draft.ganadores?.length || 0}/{singles ? 1 : 2})
              </label>
              <div className="flex flex-wrap gap-2">
                {(draft.jugadores || []).map((id) => {
                  const on = draft.ganadores.includes(id);
                  const clickSingles = () =>
                    setField(
                      "ganadores",
                      on ? [] : [id] // único ganador
                    );

                  const clickDobles = () =>
                    setDraft((d) => {
                      // si ya está seleccionado, limpiar
                      if (d.ganadores.includes(id)) {
                        return { ...d, ganadores: [] };
                      }
                      // determinar a qué equipo pertenece y setear ambos
                      let team = [];
                      if (d.equipoLocal.includes(id)) team = uniq(d.equipoLocal);
                      else if (d.equipoVisitante.includes(id))
                        team = uniq(d.equipoVisitante);
                      else return d; // no debería ocurrir
                      return { ...d, ganadores: team };
                    });

                  const onClick = singles ? clickSingles : clickDobles;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={onClick}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        on
                          ? "bg-green-700 text-white border-green-500"
                          : "bg-neutral-800 text-white/90 border-white/20 hover:bg-neutral-700"
                      }`}
                    >
                      {playerLabel(id)}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-white/60">
                {singles
                  ? "Debe haber 1 ganador."
                  : "En dobles, los 2 ganadores deben ser del mismo equipo."}
              </div>
            </div>

            {/* Resultado */}
            <div className="space-y-2">
              <label className="block text-sm">Resultado</label>
              <input
                className="w-full border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
                value={draft.resultado}
                onChange={(e) => setField("resultado", e.target.value)}
                placeholder="ej: 6-3 6-4"
              />
            </div>

            {/* Abandono */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm">Abandono</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  className="w-full sm:w-56 border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
                  value={draft.abandono}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      abandono: e.target.value,
                      abandonoJugador:
                        e.target.value === "uno" ? d.abandonoJugador : "",
                    }))
                  }
                >
                  <option value="ninguno">Ninguno</option>
                  <option value="uno">Abandona uno</option>
                  <option value="ambos">Abandonan ambos</option>
                </select>

                {draft.abandono === "uno" && (
                  <select
                    className="w-full sm:w-64 border border-white/20 bg-neutral-900 rounded-xl px-3 py-2"
                    value={draft.abandonoJugador}
                    onChange={(e) => setField("abandonoJugador", e.target.value)}
                  >
                    <option value="">Elegí el jugador…</option>
                    {(draft.jugadores || []).map((id) => (
                      <option key={id} value={id}>
                        {playerLabel(id)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="text-xs text-white/60">
                Si hay abandono, se anotará en el campo Resultado al guardar.
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Player picker modal */}
      {playerPickerOpen && (
        <PlayerPickerModal
          initialSelected={draft.jugadores}
          players={federados}
          maxCount={requiredPlayers}
          onCancel={() => setPlayerPickerOpen(false)}
          onSave={(ids) => {
            // Siempre limpiar equipos y ganadores al cambiar jugadores
            setDraft((d) => ({
              ...d,
              jugadores: limitPlayers(ids, requiredPlayers),
              equipoLocal: [],
              equipoVisitante: [],
              ganadores: [],
            }));
            setPlayerPickerOpen(false);
          }}
          title="Elegir jugadores"
        />
      )}
    </>
  );
}
