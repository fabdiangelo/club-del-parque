// /functions/src/usecases/Rankings/UpsertRankingPuntos.js
import Ranking from "../../domain/entities/Ranking.js";
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

const sanitize = (s) => String(s).toLowerCase().replace(/[^a-z0-9_-]+/g, "-");

class UpsertRankingPuntos {
  constructor() {
    this.repo = new RankingRepository();
  }

  /**
   * Crea el ranking si no existe para (usuarioID, temporadaID, tipoDePartido)
   * y suma `delta` puntos (delta puede ser 0 o negativo/positivo).
   */
  async execute({ usuarioID, temporadaID, tipoDePartido, delta }) {
    if (!usuarioID || !temporadaID || !tipoDePartido) {
      throw new Error("Faltan usuarioID, temporadaID o tipoDePartido");
    }
    const existing = await this.repo.getByUsuarioTemporadaTipo(usuarioID, temporadaID, tipoDePartido);
    if (existing) {
      if (delta) await this.repo.adjustPoints(existing.id, delta);
      return existing.id;
    }
    const id = `${sanitize(temporadaID)}-${sanitize(usuarioID)}-${sanitize(tipoDePartido)}`;
    const model = new Ranking(id, temporadaID, usuarioID, tipoDePartido);
    // creamos con puntos=0 y luego incrementamos (para mantener una sola ruta de suma)
    await this.repo.save(model.toPlainObject());
    if (delta) await this.repo.adjustPoints(id, delta);
    return id;
  }
}

export default new UpsertRankingPuntos();
