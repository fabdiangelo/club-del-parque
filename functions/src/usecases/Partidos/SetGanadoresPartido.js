export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
  }

  async execute(partidoId, ganadores = [], resultado = null) {
    const partido = await this.partidoRepo.getById(partidoId);
    if (!partido) throw new Error("Partido no encontrado");

    const updated = {
      ...partido,
      ganadores,
      resultado: resultado ?? partido.resultado,
      estado: 'finalizado'
    };

    await this.partidoRepo.update(partidoId, updated);
    return updated;
  }
}
