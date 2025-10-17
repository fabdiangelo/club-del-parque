import { applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";

export class EditarPartido {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  /**
   * Revertimos puntos del estado previo y aplicamos el nuevo estado.
   */
  async execute(id, partidoData, { puntosGanador = 0, puntosPerdedor = 0 } = {}) {
    const oldPartido = await this.partidoRepository.getById(id);
    if (!oldPartido) throw new Error("Partido no encontrado");

    // Actualizar
    const updated = await this.partidoRepository.update(id, partidoData);

    // Transferir: revertir old y aplicar new (aunque no cambien ganadores, queda idempotente)
    await applyOnEdit(oldPartido, { ...oldPartido, ...partidoData, id }, puntosGanador, puntosPerdedor);

    return updated;
  }
}
