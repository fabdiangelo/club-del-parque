// functions/src/services/Rankings/RankingsFromPartido.js
import UpsertRankingPuntos from "../../usecases/Rankings/UpsertRankingPuntos.js";

const DEFAULT_WIN = 3;

function loserDeltaFromResultado(resultado) {
  const r = String(resultado || "").toLowerCase();
  // 0 pts if WO / abandono / no presentado / ausente
  if (/(wo|walkover|abandono|no\s*presentad[oa]|np|ausent[ea])/i.test(r)) return 0;
  return 1;
}

// split winners/losers (supports singles/dobles)
function splitWinnersLosers(partido) {
  const ids = (partido.jugadores || []).map(String);
  const winners = (partido.ganadores || []).map(String);
  let losers = ids.filter((id) => !winners.includes(id));

  if (String(partido.tipoPartido) === "dobles") {
    const loc = (partido.equipoLocal || []).map(String);
    const vis = (partido.equipoVisitante || []).map(String);
    const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

    if (sameSet([...new Set(winners)], [...new Set(loc)])) losers = [...new Set(vis)];
    else if (sameSet([...new Set(winners)], [...new Set(vis)])) losers = [...new Set(loc)];
  }
  return { winners: [...new Set(winners)], losers: [...new Set(losers)] };
}

function eligible(p) {
  return (
    p &&
    String(p.estado) === "finalizado" &&
    Array.isArray(p.ganadores) &&
    p.ganadores.length > 0 &&
    p.temporadaID &&
    p.tipoPartido
  );
}

/**
 * Core: applies (sign * basePoints) per player (winners/losers).
 * If puntosGanador/perdedor are undefined, uses DEFAULT_WIN and loserDeltaFromResultado(p.resultado).
 */
async function applyPointsForPartido(partido, puntosGanador, puntosPerdedor, sign = +1) {
  if (!partido || !Array.isArray(partido.jugadores)) return;

  const { temporadaID, tipoPartido } = partido;
  if (!temporadaID || !tipoPartido) return;

  const win = Number.isFinite(puntosGanador) ? Number(puntosGanador) : DEFAULT_WIN;
  const lose = Number.isFinite(puntosPerdedor)
    ? Number(puntosPerdedor)
    : loserDeltaFromResultado(partido.resultado);

  const { winners, losers } = splitWinnersLosers(partido);

  const ups = [];
  for (const uid of winners) {
    ups.push(
      UpsertRankingPuntos.execute({
        usuarioID: String(uid),
        temporadaID: String(temporadaID),
        tipoDePartido: String(tipoPartido),
        delta: sign * win,
      })
    );
  }
  for (const uid of losers) {
    ups.push(
      UpsertRankingPuntos.execute({
        usuarioID: String(uid),
        temporadaID: String(temporadaID),
        tipoDePartido: String(tipoPartido),
        delta: sign * lose,
      })
    );
  }
  await Promise.all(ups);
}

/** On create: only if it's already finalizado + has ganadores */
export async function applyOnCreate(newPartido, puntosGanador, puntosPerdedor) {
  if (!eligible(newPartido)) return;
  await applyPointsForPartido(newPartido, puntosGanador, puntosPerdedor, +1);
}

/**
 * On edit: revert old if it was eligible, apply new if eligible.
 * This prevents duplicates and handles changes to winners/jugadores/temporada/tipo.
 */
export async function applyOnEdit(oldPartido, newPartido, puntosGanador, puntosPerdedor) {
  const oldOk = eligible(oldPartido);
  const newOk = eligible(newPartido);

  if (oldOk) await applyPointsForPartido(oldPartido, puntosGanador, puntosPerdedor, -1);
  if (newOk) await applyPointsForPartido(newPartido, puntosGanador, puntosPerdedor, +1);
}
