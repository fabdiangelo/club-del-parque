// usecases/Rankings/SetCategoriaEnRanking.js
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

export default class SetCategoriaEnRanking {
  static async execute(rankingId, categoriaId = null) {
    if (!rankingId) throw new Error("rankingId obligatorio");
    const repo = new RankingRepository();
    const row = await repo.getById(rankingId);
    if (!row) throw new Error("Ranking no encontrado");
    await repo.updatePartial(rankingId, { categoriaId: categoriaId ?? null, updatedAt: new Date().toISOString() });
    return { ok: true, id: rankingId, categoriaId: categoriaId ?? null };
  }
}
