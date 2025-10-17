// /functions/src/usecases/Rankings/UpsertRankingPuntos.js
import Ranking from "../../domain/entities/Ranking.js";
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

const sanitize = (s) => String(s).toLowerCase().replace(/[^a-z0-9_-]+/g, "-");

class UpsertRankingPuntos {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute({ usuarioID, temporadaID, tipoDePartido, delta, deporte /* optional */ }) {
    if (!usuarioID || !temporadaID || !tipoDePartido) {
      throw new Error("Faltan usuarioID, temporadaID o tipoDePartido");
    }

    const existing = await this.repo.getByUsuarioTemporadaTipo(
      usuarioID,
      temporadaID,
      tipoDePartido,
      deporte
    );

    if (existing) {
      if (delta) await this.repo.adjustPoints(existing.id, delta);
      return existing.id;
    }

    // Build id; if deporte exists, include it to keep partitions separated
    const id = [
      sanitize(temporadaID),
      sanitize(usuarioID),
      sanitize(tipoDePartido),
      deporte ? sanitize(deporte) : null,
    ].filter(Boolean).join("-");

    const model = new Ranking(id, temporadaID, usuarioID, tipoDePartido, deporte || null);
    await this.repo.save(model.toPlainObject());
    if (delta) await this.repo.adjustPoints(id, delta);
    return id;
  }
}

export default new UpsertRankingPuntos();
