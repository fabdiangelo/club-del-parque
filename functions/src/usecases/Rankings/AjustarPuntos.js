import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class AjustarPuntos {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute(id, delta) {
    if (!id) throw new Error("ID requerido");
    if (typeof delta !== "number" || !Number.isFinite(delta)) {
      throw new Error("delta numérico requerido");
    }
    await this.repo.adjustPoints(id, delta);
    return id;
  }
}

export default new AjustarPuntos();