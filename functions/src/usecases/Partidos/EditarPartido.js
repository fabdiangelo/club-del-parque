// 🔇 Rankings deshabilitados
// import { applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";

class EditarPartido {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  /**
   * Revertíamos puntos y aplicábamos nuevo estado.
   * Nota: puntosGanador / puntosPerdedor se ignoran porque rankings están deshabilitados.
   */
  async execute(id, partidoData, { puntosGanador, puntosPerdedor } = {}) {
    const oldPartido = await this.partidoRepository.getById(id);
    if (!oldPartido) throw new Error("Partido no encontrado");

    // Actualizar
    const updated = await this.partidoRepository.update(id, partidoData);

    // 🔇 Antes: transferencia de puntos con applyOnEdit
    // await applyOnEdit(oldPartido, { ...oldPartido, ...partidoData, id }, puntosGanador, puntosPerdedor);

    return updated;
  }
}

export { EditarPartido };
export default EditarPartido;
