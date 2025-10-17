import { applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";

export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
  }

  /**
   * ganadores: string[] de usuarioIDs
   * resultado: string|obj (opcional)
   * puntosGanador / puntosPerdedor: números (opcionales; si vienen undefined disparamos 3/1/0 + WO)
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

    // Usamos la misma lógica de rankings (3/1/0 + WO + deporte) que en editar
    await applyOnEdit(partido, updated, puntosGanador, puntosPerdedor);

    return updated;
  }
}
