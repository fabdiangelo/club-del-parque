// /functions/src/usecases/Rankings/ListarRankings.js
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class ListarRankings {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute({ temporadaID, usuarioID, tipoDePartido, deporte, leaderboard = false, limit } = {}) {
    if (leaderboard) {
      return this.repo.getLeaderboard({ temporadaID, tipoDePartido, deporte, limit });
    }
    if (temporadaID && tipoDePartido) {
      return this.repo.getByTemporadaYTipo(temporadaID, tipoDePartido, deporte);
    }
    if (usuarioID && tipoDePartido) {
      return this.repo.getByUsuarioYTipo(usuarioID, tipoDePartido, deporte);
    }
    if (temporadaID) return this.repo.getByTemporada(temporadaID);
    if (usuarioID) return this.repo.getByUsuario(usuarioID);
    return this.repo.getAll();
  }
}

export default new ListarRankings();
