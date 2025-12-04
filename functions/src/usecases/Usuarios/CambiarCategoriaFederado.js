// functions/src/usecases/Usuarios/CambiarCategoriaFederado.js
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { CategoriaRepository } from "../../infraestructure/adapters/CategoriaRepository.js";

class CambiarCategoriaFederado {
  constructor() {
    this.federadoRepo = new FederadoRepository();
    this.categoriaRepo = new CategoriaRepository();
  }

  /**
   * @param {string} federadoId
   * @param {string|null} categoriaId
   * - Si categoriaId es null, borra la categoría del federado.
   * - Si viene string, valida que la categoría exista.
   */
  async execute(federadoId, categoriaId, opts = {}) {
    if (!federadoId) throw new Error("federadoId obligatorio");
    if (categoriaId !== null && typeof categoriaId !== "string") {
      throw new Error("categoriaId debe ser string o null");
    }

    const { temporadaID, tipoDePartido, deporte, filtroId } = opts;
    const RankingRepository = (await import("../../infraestructure/adapters/RankingRepository.js")).RankingRepository;
    const rankingRepo = new RankingRepository();

    // LOG: inicio de operación
    console.log(`[CambiarCategoriaFederado] federadoId=${federadoId}, categoriaId=${categoriaId}, temporadaID=${temporadaID}, tipoDePartido=${tipoDePartido}, deporte=${deporte}, filtroId=${filtroId}`);

    // Validación de existencia y capacidad
    if (categoriaId) {
      const cat = await this.categoriaRepo.getById(categoriaId);
      if (!cat) throw new Error("Categoría no encontrada");
      // Filtrar rankings en la categoría destino por scope
      const rankingsEnCategoria = (await rankingRepo.getAll()).filter(r =>
        r.categoriaId === categoriaId &&
        (!temporadaID || r.temporadaID === temporadaID) &&
        (!tipoDePartido || r.tipoDePartido === tipoDePartido) &&
        (!deporte || r.deporte === deporte) &&
        (!filtroId || r.filtroId === filtroId)
      );
      console.log(`[Capacidad] Rankings en categoria destino: ${rankingsEnCategoria.length} / ${cat.capacidad}`);
      for (const r of rankingsEnCategoria) {
        console.log(`[Capacidad] Ranking ${r.id}: usuarioID=${r.usuarioID}, puntos=${r.puntos}, categoriaId=${r.categoriaId}`);
      }
      if (rankingsEnCategoria.length >= cat.capacidad) {
        console.error(`[Capacidad] La categoría destino está llena, no se puede mover.`);
        throw new Error("La categoría destino está llena (capacidad máxima alcanzada)");
      }
    }

    // Buscar ranking actual del federado en el scope
    let rankingActual = null;
    if (temporadaID && tipoDePartido) {
      const allRankings = await rankingRepo.getAll();
      rankingActual = allRankings.find(r =>
        r.usuarioID === federadoId &&
        r.temporadaID === temporadaID &&
        r.tipoDePartido === tipoDePartido &&
        (!deporte || r.deporte === deporte) &&
        (!filtroId || r.filtroId === filtroId)
      );
      if (rankingActual) {
        console.log(`[Ranking] Antes de mover: id=${rankingActual.id}, puntos=${rankingActual.puntos}, ganados=${rankingActual.partidosGanados}, perdidos=${rankingActual.partidosPerdidos}, categoriaId=${rankingActual.categoriaId}`);
        // Si el ranking ya está en la categoría destino, no hacer nada
        if (rankingActual.categoriaId === categoriaId) {
          console.log(`[Ranking] Ya está en la categoría destino, no se mueve.`);
        } else {
          // Actualizar solo el campo categoriaId, conservando stats
          await rankingRepo.update(rankingActual.id, { categoriaId });
          console.log(`[Ranking] Movido a categoriaId=${categoriaId}`);
        }
      } else {
        console.log(`[Ranking] No existe ranking previo en el scope, se creará uno nuevo al sincronizar.`);
      }
    }

    // Actualiza solo el campo categoriaId del federado
    const out = await this.federadoRepo.setCategoria(federadoId, categoriaId);
    // LOG: resultado final
    const rankingDespues = temporadaID && tipoDePartido
      ? (await rankingRepo.getAll()).find(r =>
          r.usuarioID === federadoId &&
          r.temporadaID === temporadaID &&
          r.tipoDePartido === tipoDePartido &&
          (!deporte || r.deporte === deporte) &&
          (!filtroId || r.filtroId === filtroId)
        )
      : null;
    if (rankingDespues) {
      console.log(`[Ranking] Después de mover: id=${rankingDespues.id}, puntos=${rankingDespues.puntos}, ganados=${rankingDespues.partidosGanados}, perdidos=${rankingDespues.partidosPerdidos}, categoriaId=${rankingDespues.categoriaId}`);
    }
    return { id: out.id, categoriaId: out.categoriaId ?? null };
  }
}

export default new CambiarCategoriaFederado();
