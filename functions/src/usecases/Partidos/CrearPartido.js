// 🔇 Rankings deshabilitados: se elimina el import
// import { applyOnCreate } from "../../services/Rankings/RankingsFromPartido.js";

export class CrearPartido {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  /**
   * partidoData puede incluir opcionalmente puntosGanador y puntosPerdedor en el payload del controller.
   * Nota: parámetros ignorados porque los rankings están deshabilitados.
   */
  async execute(partidoData, { puntosGanador, puntosPerdedor } = {}) {
    // Guardar partido
    const nuevoPartido = await this.partidoRepository.save(partidoData);

    // 🔇 Antes: si había ganadores, se aplicaban rankings al crear
    // await applyOnCreate({ ...partidoData, id: nuevoPartido.id || partidoData.id }, puntosGanador, puntosPerdedor);

    return nuevoPartido;
  }
}

export default CrearPartido;
