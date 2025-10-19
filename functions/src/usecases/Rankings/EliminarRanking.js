import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class EliminarRanking {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute(id) {
    if (!id) throw new Error("ID requerido");
    await this.repo.delete(id);
    return { ok: true };
  }
}

export default new EliminarRanking();
