import { applyOnCreate } from "../../services/Rankings/RankingsFromPartido.js";

export class CrearPartido {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  /**
   * partidoData puede incluir opcionalmente puntosGanador y puntosPerdedor en el payload del controller.
   * Para disparar el default 3/1/0, pasá undefined (no 0).
   */
  async execute(partidoData, { puntosGanador, puntosPerdedor } = {}) {
    // Guardar partido
    const newId = await this.partidoRepository.save(partidoData);

    // Si ya viene con ganadores definidos al crear, aplicar ranking
    if (Array.isArray(partidoData.ganadores)) {
      await applyOnCreate(
        { ...partidoData, id: newId || partidoData.id },
        puntosGanador,
        puntosPerdedor
      );
    }

    return newId;
  }
}
