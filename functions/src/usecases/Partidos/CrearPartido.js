import { applyOnCreate } from "../../services/Rankings/RankingsFromPartido.js";

export class CrearPartido {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  /**
   * partidoData puede incluir opcionalmente puntosGanador y puntosPerdedor en el payload del controller.
   */
  async execute(partidoData, { puntosGanador, puntosPerdedor } = {}) {
    // Guardar partido
    const nuevoPartido = await this.partidoRepository.save(partidoData);

    // Si ya viene con ganadores definidos al crear, aplicar ranking
    if (Array.isArray(partidoData.ganadores)) {
      await applyOnCreate(
        { ...partidoData, id: nuevoPartido.id || partidoData.id }, // asegurar id si lo retorna el repo
        puntosGanador,
        puntosPerdedor
      );
    }

    return nuevoPartido;
  }
}
