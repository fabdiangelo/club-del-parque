import UpsertRankingPuntos from "../../usecases/Rankings/UpsertRankingPuntos.js";

const DEFAULT_WIN = 3;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const toStr = (v) => String(v ?? "").trim();
const uniq = (arr = []) => Array.from(new Set((arr || []).map(toStr)));
const L = (s) => String(s || "").toLowerCase();

// WO / abandono flags genéricos
const hasGenericAbandonoFlag = (resultado, estado) => {
  const text =
    typeof resultado === "string"
      ? resultado
      : (resultado?.motivo || resultado?.razon || resultado?.detalle || "");
  return /(wo|walkover|abandono|no\s*presentad[oa]|np|ausent[ea])/i.test(String(text)) ||
         /^(wo|walkover)$/i.test(String(estado || ""));
};

// Devuelve Set de jugadores que abandonaron si viene explícito (resultado.abandona / abandonoPor / walkoverPor)
// Puede ser string o string[]
const getAbandoners = (resultado) => {
  const raw = resultado?.abandona ?? resultado?.abandonoPor ?? resultado?.walkoverPor ?? null;
  if (!raw) return new Set();
  if (Array.isArray(raw)) return new Set(uniq(raw));
  return new Set([toStr(raw)]);
};

// Split winners/losers (apoya singles/dobles y valida equipo ganador en dobles)
function splitWinnersLosers(partido) {
  const ids = (partido.jugadores || []).map(String);
  const winners = (partido.ganadores || []).map(String);
  let losers = ids.filter((id) => !winners.includes(id));

  if (String(partido.tipoPartido) === "dobles") {
    // Prefer jugador1/jugador2 arrays when present (each item may be an object with id)
    const loc = Array.isArray(partido.jugador1) ? partido.jugador1.map(p => String(p?.id)) : (partido.equipoLocal || []).map(String);
    const vis = Array.isArray(partido.jugador2) ? partido.jugador2.map(p => String(p?.id)) : (partido.equipoVisitante || []).map(String);
    const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

    if (sameSet([...new Set(winners)], [...new Set(loc)])) losers = [...new Set(vis)];
    else if (sameSet([...new Set(winners)], [...new Set(vis)])) losers = [...new Set(loc)];
  }

  return { winners: [...new Set(winners)], losers: [...new Set(losers)] };
}

// Elegibilidad:
// - Create: si tiene ganadores + temporadaID + tipoPartido (no exige estado finalizado)
// - Edit: exige finalizado + ganadores (conservamos tu criterio original para ediciones)
function eligibleForCreate(p) {
  return (
    p &&
    Array.isArray(p.ganadores) &&
    p.ganadores.length > 0 &&
    p.temporadaID &&
    p.tipoPartido
  );
}

function eligibleForEdit(p) {
  return p
    && String(p.estado) === "finalizado"
    && Array.isArray(p.ganadores) && p.ganadores.length > 0
    && p.temporadaID && p.tipoPartido;
}


// ────────────────────────────────────────────────────────────────────────────
// Core apply (con contadores y abandono por jugador)
// ────────────────────────────────────────────────────────────────────────────
async function applyPointsForPartido(partido, puntosGanador, puntosPerdedor, sign = +1) {
  if (!partido || !Array.isArray(partido.jugadores)) return;

  const { temporadaID } = partido;
  if (!temporadaID) return;

  // Obtener el tipoDePartido correcto desde el campeonato (vía etapa si es necesario)
  let tipoDePartido = null;
  let campeonatoID = partido.campeonatoID;
  if (!campeonatoID && partido.etapa) {
    try {
      const { EtapaRepository } = await import("../../infraestructure/adapters/EtapaRepository.js");
      const etapaRepo = new EtapaRepository();
      const etapa = await etapaRepo.findById(partido.etapa);
      if (etapa && etapa.campeonatoID) {
        campeonatoID = etapa.campeonatoID;
      }
    } catch (e) {
      // fallback abajo
    }
  }
  if (campeonatoID) {
    try {
      const { CampeonatoRepository } = await import("../../infraestructure/adapters/CampeonatoRepository.js");
      const campRepo = new CampeonatoRepository();
      const camp = await campRepo.findById(campeonatoID);
      if (camp) {
        // Usar tipoDePartido del campeonato si existe, si no, deducir por dobles
        tipoDePartido = (camp.dobles ? "dobles" : "singles");
      }
    } catch (e) {
      // fallback abajo
    }
  }
  // Fallback: si no hay campeonato, intentar deducir por partido
  if (!tipoDePartido) {
    if (String(partido.tipoPartido).toLowerCase().includes("doble")) tipoDePartido = "dobles";
    else tipoDePartido = "singles";
  }

  const deporte = (String(partido.deporte || "").trim().toLowerCase()) || null;

  const win = Number.isFinite(puntosGanador) ? Number(puntosGanador) : DEFAULT_WIN;

  // Si puntosPerdedor es undefined, resolvemos 1 u 0 según WO/abandono.
  // Priorizamos abandono individual (resultado.abandona) y, si no está, un flag genérico para todos los perdedores.
  const resultado = partido.resultado;
  const estado = partido.estado;
  const abandoners = getAbandoners(resultado);              // p.ej. Set(['uidX', 'uidY'])
  const genericWO = hasGenericAbandonoFlag(resultado, estado);

  const loseFallback = Number.isFinite(puntosPerdedor) ? Number(puntosPerdedor) : 1; // default 1
  const { winners, losers } = splitWinnersLosers(partido);

  const ups = [];

  // Obtener género del partido
  const genero = partido.genero ?? null;

  // Si el género es null, no crear ningún ranking
  if (genero == null) return;

  // Ganadores → +3 y +1 ganado
  for (const uid of winners) {
    ups.push(
      UpsertRankingPuntos.execute({
        usuarioID: String(uid),
        temporadaID: String(temporadaID),
        tipoDePartido,
        deporte,
        genero,
        delta: sign * win,
        deltaGanados: sign * 1,
      })
    );
  }

  // Perdedores → +1 o +0 si abandono; contadores perdidos/abandonados
  for (const uidRaw of losers) {
    const uid = String(uidRaw);
    const abandonedThis = abandoners.has(uid);
    // Si NO hay lista explícita pero hay flag genérico, tratamos a todos los perdedores como abandono
    const isAbandono = abandonedThis || (!abandoners.size && genericWO);

    const losePoints = Number.isFinite(puntosPerdedor)
      ? Number(puntosPerdedor)                        // override explícito
      : (isAbandono ? 0 : loseFallback);              // default 0 si abandono, 1 caso contrario

    ups.push(
      UpsertRankingPuntos.execute({
        usuarioID: uid,
        temporadaID: String(temporadaID),
        tipoDePartido,
        deporte,
        genero,
        delta: sign * losePoints,
        deltaPerdidos: isAbandono ? 0 : sign * 1,
        deltaAbandonados: isAbandono ? sign * 1 : 0,
      })
    );
  }

  await Promise.all(ups);
}

// ────────────────────────────────────────────────────────────────────────────
// API pública (respeta tu firma original)
// ────────────────────────────────────────────────────────────────────────────

/** CREATE: si ya está con ganadores, aplica 3/1/0 (o overrides), sin exigir estado finalizado */
export async function applyOnCreate(newPartido, puntosGanador, puntosPerdedor) {
  if (!eligibleForCreate(newPartido)) return;
  await applyPointsForPartido(newPartido, puntosGanador, puntosPerdedor, +1);
}


export async function applyOnEdit(oldPartido, newPartido, puntosGanador, puntosPerdedor) {
  const oldOk = eligibleForEdit(oldPartido);
  const newOk = eligibleForEdit(newPartido);
  if (oldOk) await applyPointsForPartido(oldPartido, puntosGanador, puntosPerdedor, -1);
  if (newOk) await applyPointsForPartido(newPartido, puntosGanador, puntosPerdedor, +1);
}

