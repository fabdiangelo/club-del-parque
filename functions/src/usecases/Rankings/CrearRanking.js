import Ranking from "../../domain/entities/Ranking.js";
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

const sanitize = (s) => String(s).toLowerCase().replace(/[^a-z0-9_-]+/g, "-");

class CrearRanking {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute({ id, temporadaID, usuarioID, tipoDePartido }) {
    if (!temporadaID || !usuarioID) throw new Error("Faltan campos requeridos: temporadaID, usuarioID");

    // Si hay tipoDePartido lo incluimos en el ID determinístico; si no, no.
    const rankingId =
      id ||
      (tipoDePartido
        ? `${sanitize(temporadaID)}-${sanitize(usuarioID)}-${sanitize(tipoDePartido)}`
        : `${sanitize(temporadaID)}-${sanitize(usuarioID)}`);

    const model = new Ranking(rankingId, temporadaID, usuarioID, tipoDePartido);
    await this.repo.save(model.toPlainObject());
    return rankingId;
  }
}

export default new CrearRanking();
