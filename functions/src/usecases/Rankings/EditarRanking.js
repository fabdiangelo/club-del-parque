import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class EditarRanking {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute(id, data = {}) {
    if (!id) throw new Error("ID requerido");
    await this.repo.update(id, data);
    return id;
  }
}

export default new EditarRanking();
