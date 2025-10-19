import { applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";

class EditarPartido {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  /**
   * Revertimos puntos del estado previo y aplicamos el nuevo estado.
   * Para usar default 3/1/0, pasá undefined en puntosGanador/Perdedor.
   */
  async execute(id, partidoData, { puntosGanador, puntosPerdedor } = {}) {
    const oldPartido = await this.partidoRepository.getById(id);
    if (!oldPartido) throw new Error("Partido no encontrado");

    // Actualizar
    const updated = await this.partidoRepository.update(id, partidoData);

    // Transferencia de puntos (idempotente)
    await applyOnEdit(oldPartido, { ...oldPartido, ...partidoData, id }, puntosGanador, puntosPerdedor);

    return updated;
  }
}

// Export nombrado y default (para evitar problemas de import)
export { EditarPartido };
export default EditarPartido;
