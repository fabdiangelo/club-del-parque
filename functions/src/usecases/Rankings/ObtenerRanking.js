import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class ObtenerRanking {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute(id) {
    if (!id) throw new Error("ID requerido");
    const r = await this.repo.findById(id);
    if (!r) throw new Error("Ranking no encontrado");
    return r;
  }
}

export default new ObtenerRanking();
