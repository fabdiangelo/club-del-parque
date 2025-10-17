// Aplica/Revierte puntos de ranking a partir de un Partido
import UpsertRankingPuntos from "../../usecases/Rankings/UpsertRankingPuntos.js";

/**
 * Aplica puntos para un partido "tal cual" está (sign=+1 para sumar, sign=-1 para revertir).
 * - temporadaID y tipoPartido determinan la partición del ranking
 * - ganadores es array de userIDs
 * - jugadores es array de todos los userIDs participantes
 */
async function applyPointsForPartido(partido, puntosGanador = 0, puntosPerdedor = 0, sign = +1) {
  if (!partido || !Array.isArray(partido.jugadores)) return;

  const { temporadaID, tipoPartido, ganadores = [] } = partido;
  if (!temporadaID || !tipoPartido) {
    console.warn("[RankingsFromPartido] Falta temporadaID o tipoPartido; no se actualiza ranking.");
    return;
  }

  const winnersSet = new Set(Array.isArray(ganadores) ? ganadores : []);
  for (const uid of partido.jugadores) {
    const base = winnersSet.has(uid) ? Number(puntosGanador || 0) : Number(puntosPerdedor || 0);
    const delta = sign * base;

    // Siempre garantizamos existencia de ranking, aun con delta=0
    await UpsertRankingPuntos.execute({
      usuarioID: uid,
      temporadaID,
      tipoDePartido: tipoPartido,
      delta: Number.isFinite(delta) ? delta : 0
    });
  }
}

/**
 * Al crear: solo aplicar puntos del partido nuevo.
 */
export async function applyOnCreate(newPartido, puntosGanador = 0, puntosPerdedor = 0) {
  await applyPointsForPartido(newPartido, puntosGanador, puntosPerdedor, +1);
}

/**
 * Al editar: revertir "old" y aplicar "new".
 * Esto cubre cambio de ganadores, cambio de jugadores, cambio de temporada o de tipoPartido.
 */
export async function applyOnEdit(oldPartido, newPartido, puntosGanador = 0, puntosPerdedor = 0) {
  if (oldPartido) await applyPointsForPartido(oldPartido, puntosGanador, puntosPerdedor, -1);
  if (newPartido) await applyPointsForPartido(newPartido, puntosGanador, puntosPerdedor, +1);
}
