// 🔇 Rankings deshabilitados
// import { applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";

export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
  }

  /**
   * ganadores: string[] de usuarioIDs
   * resultado: string|obj (opcional)
   * puntosGanador / puntosPerdedor: ignorados (rankings deshabilitados)
   */
  async execute(partidoId, ganadores = [], resultado = null, puntosGanador, puntosPerdedor) {
    const partido = await this.partidoRepo.getById(partidoId);
    if (!partido) throw new Error("Partido no encontrado");

    const uniq = (arr = []) => Array.from(new Set((arr || []).map((v) => String(v).trim())));

    const updated = {
      ...partido,
      ganadores: uniq(ganadores),
      resultado: resultado ?? partido.resultado,
      estado: "finalizado",
    };

    await this.partidoRepo.update(partidoId, updated);

    // 🔇 Antes: misma lógica de rankings applyOnEdit(...)
    // await applyOnEdit(partido, updated, puntosGanador, puntosPerdedor);

    return updated;
  }
}
