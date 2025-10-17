import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class ResetPuntos {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute(id, nuevoValor = 0) {
    if (!id) throw new Error("ID requerido");
    await this.repo.update(id, { puntos: nuevoValor });
    return id;
  }
}

export default new ResetPuntos();
