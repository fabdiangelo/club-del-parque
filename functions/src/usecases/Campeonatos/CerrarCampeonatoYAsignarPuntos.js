import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { FederadoCampeonatoRepository } from "../../infraestructure/adapters/FederadoCampeonatoRepository.js";
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";

const PUNTOS_MINIMOS = 0; 
const DEFAULT_TABLA = { 1: 1000, 2: 600, 3: 360, 4: 270, 5: 180, 6: 150, 7: 120, 8: 90 };

export default class CerrarCampeonatoYAsignarPuntos {
  constructor() {
    this.campRepo = new CampeonatoRepository();
    this.etapaRepo = new EtapaRepository();
    this.fcRepo = new FederadoCampeonatoRepository();
    this.rankingRepo = new RankingRepository();
  }

  puntos(camp, pos) {
    const tabla = camp?.puntosPorPosicion || DEFAULT_TABLA;
    return Number(tabla?.[String(pos)] ?? PUNTOS_MINIMOS);
  }

  async execute(campeonatoId) {
    const camp = await this.campRepo.findById(campeonatoId);
    if (!camp) throw new Error("Campeonato no encontrado");
    if (!Array.isArray(camp.etapasIDs) || !camp.etapasIDs.length)
      throw new Error("Campeonato sin etapas");

    const etapaFinalId = camp.etapasIDs[camp.etapasIDs.length - 1];
    const etapa = await this.etapaRepo.findById(etapaFinalId);
    if (!etapa) throw new Error("Etapa final no encontrada");

    // 1) construir mapa federadoID -> posicionFinal
    const posiciones = etapa.tipoEtapa === "eliminacion"
      ? this._posicionesEliminacion(etapa)
      : this._posicionesRoundRobin(etapa, !!camp.dobles);

    // 2) persistir en FederadoCampeonato y sumar al ranking
    const allFcs = await this.fcRepo.getAllFederados();
    const relacionados = (allFcs || []).filter(x => x.campeonatoID === campeonatoId);

    for (const fc of relacionados) {
      const pos = posiciones[fc.federadoID] || null;
      const pts = pos ? this.puntos(camp, pos) : 0;

      // a) guarda en el propio registro de inscripción (auditoría)
      await this.fcRepo.update(fc.id, { posicionFinal: pos, puntosRanking: pts }).catch(()=>{});

      // b) asegura ranking y suma SOLO puntos por posición
      if (!camp.temporadaID || !camp.tipoDePartido) continue; // si falta metadata, no toco ranking

      // buscar ranking existente del usuario
      const existing = await this.rankingRepo.getByUsuarioTemporadaTipo(
        fc.federadoID,
        camp.temporadaID,
        camp.tipoDePartido,
        camp.deporte
      );

      if (!existing) {
        // crea doc en 0 y luego suma
        const id = [
          String(camp.temporadaID).toLowerCase(),
          String(fc.federadoID).toLowerCase(),
          String(camp.tipoDePartido).toLowerCase(),
          camp.deporte ? String(camp.deporte).toLowerCase() : null
        ].filter(Boolean).join("-");
        await this.rankingRepo.save({
          id,
          temporadaID: camp.temporadaID,
          usuarioID: fc.federadoID,
          tipoDePartido: camp.tipoDePartido,
          deporte: camp.deporte || null,
          puntos: 0,
          partidosGanados: 0,
          partidosPerdidos: 0,
          partidosAbandonados: 0,
        });
        if (pts) await this.rankingRepo.adjustPoints(id, pts);
      } else {
        if (pts) await this.rankingRepo.adjustPoints(existing.id, pts);
      }
    }

    return { ok: true, posiciones };
  }

  // ===== Helpers de posiciones =====

  _posicionesEliminacion(etapa) {
    // Asigna:
    // 1 = campeón (ganador final), 2 = finalista (perdedor final),
    // luego perdedores de semis = 3..4, cuartos = 5..8, etc.
    const map = {};
    const rondas = [...(etapa.rondas || [])].sort((a,b)=>a.indice - b.indice);

    const perdedoresPorRonda = {}; // indice -> [id...]
    const ganadoresFinal = [];
    const perdedoresFinal = [];

    for (const r of rondas) {
      for (const p of (r.partidos || [])) {
        if (p.estado !== "finalizado" && p.estado !== "cerrado") continue;
        const g = p.ganadorId;
        const l = (p.jugador1Id && p.jugador1Id !== g) ? p.jugador1Id :
                  (p.jugador2Id && p.jugador2Id !== g) ? p.jugador2Id : null;

        const isFinal = r.indice === (rondas.length - 1);
        if (isFinal) {
          if (g) ganadoresFinal.push(g);
          if (l) perdedoresFinal.push(l);
        } else {
          if (l) {
            if (!perdedoresPorRonda[r.indice]) perdedoresPorRonda[r.indice] = [];
            perdedoresPorRonda[r.indice].push(l);
          }
        }
      }
    }

    let pos = 1;
    for (const id of ganadoresFinal) map[id] = pos++;
    for (const id of perdedoresFinal) map[id] = pos++;

    for (let i = rondas.length - 2; i >= 0; i--) {
      const perd = perdedoresPorRonda[i] || [];
      for (const id of perd) map[id] = pos++;
    }
    return map;
  }

  _posicionesRoundRobin(etapa, esDobles) {
    // merge por “puestos” de cada grupo: 1ros de todos los grupos primero, luego 2dos, etc.
    const grupos = etapa.grupos || [];
    const ordenados = grupos.map(g => {
      const rows = (g.jugadores || []).map(slot => {
        const federadoIDs = esDobles
          ? (slot.players || []).map(p => p?.id).filter(Boolean)
          : [slot.id].filter(Boolean);
        return {
          federadoIDs,
          puntos: Number(slot.puntos || 0),
          ganados: Number(slot.ganados || 0),
          setsDG: Number(slot.setsGanados || 0) - Number(slot.setsPerdidos || 0),
          juegosDG: Number(slot.juegosGanados || 0) - Number(slot.juegosPerdidos || 0),
        };
      });
      rows.sort((a,b)=>{
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.ganados !== a.ganados) return b.ganados - a.ganados;
        if (b.setsDG !== a.setsDG) return b.setsDG - a.setsDG;
        return b.juegosDG - a.juegosDG;
      });
      return rows;
    });

    const maxLen = Math.max(0, ...ordenados.map(t=>t.length));
    const rankingGlobal = [];
    for (let place = 0; place < maxLen; place++) {
      for (const t of ordenados) if (t[place]) rankingGlobal.push(t[place]);
    }

    const map = {};
    let pos = 1;
    for (const row of rankingGlobal) {
      for (const fid of row.federadoIDs) if (fid && !map[fid]) map[fid] = pos;
      pos++;
    }
    return map;
  }
}
