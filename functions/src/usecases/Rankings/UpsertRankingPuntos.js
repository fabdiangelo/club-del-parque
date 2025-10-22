import Ranking from "../../domain/entities/Ranking.js";
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";
const sanitize = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
const DEFAULTS = { win: 3, loss: 1, abandon: 0 };

function outcomeToDeltas(outcome, { puntosGanador, puntosPerdedor } = {}) {
  const o = String(outcome || "").toLowerCase();
  if (o === "win" || o === "winner" || o === "ganado" || o === "gano") {
    const delta = Number.isFinite(puntosGanador) ? Number(puntosGanador) : DEFAULTS.win;
    return { delta, deltaGanados: 1, deltaPerdidos: 0, deltaAbandonados: 0 };
  }
  if (o === "loss" || o === "perdio" || o === "perdido" || o === "perder") {
    const delta = Number.isFinite(puntosPerdedor) ? Number(puntosPerdedor) : DEFAULTS.loss;
    return { delta, deltaGanados: 0, deltaPerdidos: 1, deltaAbandonados: 0 };
  }
  if (o === "abandon" || o === "wo" || o === "walkover" || o === "abandono") {
    const delta = DEFAULTS.abandon; // siempre 0
    return { delta, deltaGanados: 0, deltaPerdidos: 0, deltaAbandonados: 1 };
  }
  return { delta: 0, deltaGanados: 0, deltaPerdidos: 0, deltaAbandonados: 0 };
}

class UpsertRankingPuntos {
  constructor() {
    this.repo = new RankingRepository();
  }

  async execute({
    usuarioID,
    temporadaID,
    tipoDePartido,
    deporte,              
    outcome,              
    puntosGanador,        
    puntosPerdedor,      
    delta,                
    deltaGanados,         
    deltaPerdidos,        
    deltaAbandonados,     
  } = {}) {
    if (!usuarioID || !temporadaID || !tipoDePartido) {
      throw new Error("Faltan usuarioID, temporadaID o tipoDePartido");
    }

    let resolved = {
      delta: Number.isFinite(delta) ? Number(delta) : undefined,
      deltaGanados: Number.isFinite(deltaGanados) ? Number(deltaGanados) : undefined,
      deltaPerdidos: Number.isFinite(deltaPerdidos) ? Number(deltaPerdidos) : undefined,
      deltaAbandonados: Number.isFinite(deltaAbandonados) ? Number(deltaAbandonados) : undefined,
    };

    if (typeof outcome !== "undefined" && outcome !== null) {
      const auto = outcomeToDeltas(outcome, { puntosGanador, puntosPerdedor });
      resolved = {
        delta: Number.isFinite(resolved.delta) ? resolved.delta : auto.delta,
        deltaGanados: Number.isFinite(resolved.deltaGanados) ? resolved.deltaGanados : auto.deltaGanados,
        deltaPerdidos: Number.isFinite(resolved.deltaPerdidos) ? resolved.deltaPerdidos : auto.deltaPerdidos,
        deltaAbandonados: Number.isFinite(resolved.deltaAbandonados) ? resolved.deltaAbandonados : auto.deltaAbandonados,
      };
    }

    // Normalizar a números (incluye 0 válidos)
    const deltas = {
      puntos: Number.isFinite(resolved.delta) ? Number(resolved.delta) : 0,
      partidosGanados: Number.isFinite(resolved.deltaGanados) ? Number(resolved.deltaGanados) : 0,
      partidosPerdidos: Number.isFinite(resolved.deltaPerdidos) ? Number(resolved.deltaPerdidos) : 0,
      partidosAbandonados: Number.isFinite(resolved.deltaAbandonados) ? Number(resolved.deltaAbandonados) : 0,
    };

    // Buscar existente (particionado por deporte si aplica)
    const existing = await this.repo.getByUsuarioTemporadaTipo(
      usuarioID,
      temporadaID,
      tipoDePartido,
      deporte
    );

    // Helper: aplicar en un solo write si existe adjustMany; si no, fallback
    const applyDeltas = async (id) => {
      if (typeof this.repo.adjustMany === "function") {
        // Un solo roundtrip; incluye 0 sin problema (no suma nada)
        return this.repo.adjustMany(id, deltas);
      }

      // Fallback compatible si no hay adjustMany
      const { puntos, partidosGanados, partidosPerdidos, partidosAbandonados } = deltas;

      if (puntos) await this.repo.adjustPoints(id, puntos);
      if (partidosGanados) await this.repo.adjustCounter?.(id, "partidosGanados", partidosGanados);
      if (partidosPerdidos) await this.repo.adjustCounter?.(id, "partidosPerdidos", partidosPerdidos);
      if (partidosAbandonados) await this.repo.adjustCounter?.(id, "partidosAbandonados", partidosAbandonados);
      return id;
    };

    if (existing) {
      await applyDeltas(existing.id);
      return existing.id;
    }

    // Crear nuevo id (incluyendo deporte si viene, para particionar)
    const id = [
      sanitize(temporadaID),
      sanitize(usuarioID),
      sanitize(tipoDePartido),
      deporte ? sanitize(deporte) : null,
    ].filter(Boolean).join("-");

    // Crear modelo base (puntos en 0 — los deltas se aplican debajo)
    const model = new Ranking(id, temporadaID, usuarioID, tipoDePartido, deporte || null);
    await this.repo.save(model.toPlainObject());

    // MUY IMPORTANTE: aplicar inmediatamente puntos + contadores también en la creación
    await applyDeltas(id);

    return id;
  }
}

export default new UpsertRankingPuntos();
