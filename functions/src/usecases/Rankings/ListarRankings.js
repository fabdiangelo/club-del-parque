import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

class ListarRankings {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute({ temporadaID, usuarioID, tipoDePartido, leaderboard = false, limit = 50 } = {}) {
    if (leaderboard) {
      return await this.repo.getLeaderboard({ temporadaID, tipoDePartido, limit });
    }
    if (temporadaID && tipoDePartido) return await this.repo.getByTemporadaYTipo(temporadaID, tipoDePartido);
    if (usuarioID && tipoDePartido) return await this.repo.getByUsuarioYTipo(usuarioID, tipoDePartido);
    if (temporadaID) return await this.repo.getByTemporada(temporadaID);
    if (usuarioID) return await this.repo.getByUsuario(usuarioID);
    return await this.repo.getAll();
  }
}

export default new ListarRankings();
