export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
  }

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

    return updated;
  }
}
