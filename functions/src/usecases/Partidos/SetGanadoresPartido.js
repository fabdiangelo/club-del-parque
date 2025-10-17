// /functions/src/usecases/Partidos/SetGanadoresPartido.js
import UpsertRankingPuntos from "../Rankings/UpsertRankingPuntos.js";

export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
  }

  /**
   * ganadores: string[] de usuarioIDs
   * resultado: objeto (opcional)
   * puntosGanador / puntosPerdedor: números (opcionales; default 0)
   */
  async execute(partidoId, ganadores = [], resultado = null, puntosGanador = 0, puntosPerdedor = 0) {
    const partido = await this.partidoRepo.getById(partidoId);
    if (!partido) throw new Error("Partido no encontrado");

    const updated = {
      ...partido,
      ganadores,
      resultado: resultado ?? partido.resultado,
      estado: "finalizado",
    };

    await this.partidoRepo.update(partidoId, updated);

    // ----- ACTUALIZAR RANKINGS -----
    const { temporadaID, tipoPartido } = updated;
    if (!temporadaID || !tipoPartido) {
      // No bloquea si faltan datos; solo loguea
      console.warn("Ranking no actualizado: falta temporadaID o tipoPartido en el partido", partidoId);
      return updated;
    }

    const winnersSet = new Set(Array.isArray(ganadores) ? ganadores : []);
    const jugadores = Array.isArray(updated.jugadores) ? updated.jugadores : [];

    // A cada jugador le asignamos delta según si es ganador
    for (const uid of jugadores) {
      const delta = winnersSet.has(uid) ? Number(puntosGanador || 0) : Number(puntosPerdedor || 0);
      if (Number.isFinite(delta) && delta !== 0) {
        await UpsertRankingPuntos.execute({
          usuarioID: uid,
          temporadaID,
          tipoDePartido: tipoPartido, // usamos el mismo string del partido
          delta,
        });
      } else {
        // Incluso si delta=0, garantizá creación de ranking si no existe
        await UpsertRankingPuntos.execute({
          usuarioID: uid,
          temporadaID,
          tipoDePartido: tipoPartido,
          delta: 0,
        });
      }
    }

    return updated;
  }
}
