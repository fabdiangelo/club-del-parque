export class AgregarDisponibilidad {
  constructor(partidoRepository) {
    this.partidoRepository = partidoRepository;
  }

  async execute(partidoId, disponibilidad = [], usuarioId = null) {
    if (!partidoId) throw new Error("partidoId requerido");

    console.log("disponibilidad recibida:", disponibilidad);
    if (!Array.isArray(disponibilidad)) throw new Error("disponibilidad debe ser un array");
    return await this.partidoRepository.addDisponibilidad(partidoId, disponibilidad, usuarioId);
  }
}
