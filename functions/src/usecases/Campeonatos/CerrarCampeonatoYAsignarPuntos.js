const DEFAULT_TABLA = { 1: 1000, 2: 600, 3: 360, 4: 270, 5: 180, 6: 150, 7: 120, 8: 90 };

import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { FederadoCampeonatoRepository } from "../../infraestructure/adapters/FederadoCampeonatoRepository.js";
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

export default class CerrarCampeonatoYAsignarPuntos {
  constructor() {
    this.campRepo = new CampeonatoRepository();
    this.etapaRepo = new EtapaRepository();
    this.fcRepo = new FederadoCampeonatoRepository();
    this.rankingRepo = new RankingRepository();
    this.federadoRepo = new FederadoRepository();
  }

  puntos(camp, pos) {
    const tabla = camp?.puntosPorPosicion || DEFAULT_TABLA;
    if (tabla?.[String(pos)] != null) return Number(tabla[String(pos)]);
    const posiciones = Object.keys(DEFAULT_TABLA).map(Number).sort((a, b) => a - b);
    if (posiciones.length && Number(pos) > Math.max(...posiciones)) {
      return Number(DEFAULT_TABLA[posiciones[posiciones.length - 1]]) || 0;
    }
    return 0;
  }

  async execute(campeonatoId) {
    const camp = await this.campRepo.findById(campeonatoId);
    if (!camp) throw new Error("Campeonato no encontrado");
    if (!Array.isArray(camp.etapasIDs) || !camp.etapasIDs.length)
      throw new Error("Campeonato sin etapas");

    // Cargar todas las etapas del campeonato
    const etapas = [];
    for (const etapaId of camp.etapasIDs) {
      const etapa = await this.etapaRepo.findById(etapaId);
      if (etapa) etapas.push(etapa);
    }
    if (!etapas.length) throw new Error("No se encontraron etapas para el campeonato");

    // Determinar si es dobles según la configuración del campeonato
    const esDobles = !!camp.dobles;
    // Calcular posiciones sumando victorias en todas las etapas
    const posiciones = this._posicionesPorVictoriasTodasEtapas(etapas, esDobles);

    // Calcular partidos ganados y perdidos por federado en todo el campeonato
    const partidosStats = {};
    for (const etapa of etapas) {
      if (etapa.tipoEtapa === "eliminacion") {
        const rondas = Array.isArray(etapa.rondas) ? etapa.rondas : [];
        for (const r of rondas) {
          for (const p of Array.isArray(r.partidos) ? r.partidos : []) {
            if (p.estado !== "finalizado" && p.estado !== "cerrado") continue;
            // Ganador
            if (p.ganadorId) {
              partidosStats[p.ganadorId] = partidosStats[p.ganadorId] || { ganados: 0, perdidos: 0 };
              partidosStats[p.ganadorId].ganados++;
            }
            // Perdedor
            let perdedorId = null;
            if (p.ganadorId && p.jugador1Id && p.jugador2Id) {
              perdedorId = p.ganadorId === p.jugador1Id ? p.jugador2Id : p.jugador1Id;
              if (perdedorId) {
                partidosStats[perdedorId] = partidosStats[perdedorId] || { ganados: 0, perdidos: 0 };
                partidosStats[perdedorId].perdidos++;
              }
            }
          }
        }
      } else if (etapa.tipoEtapa === "roundRobin") {
        const grupos = Array.isArray(etapa.grupos) ? etapa.grupos : [];
        for (const g of grupos) {
          for (const partido of Array.isArray(g.partidos) ? g.partidos : []) {
            if (partido.estado !== "finalizado" && partido.estado !== "cerrado") continue;
            // Ganadores
            if (Array.isArray(partido.ganadores)) {
              for (const ganadorId of partido.ganadores) {
                partidosStats[ganadorId] = partidosStats[ganadorId] || { ganados: 0, perdidos: 0 };
                partidosStats[ganadorId].ganados++;
              }
            }
            // Perdidos: todos los jugadores menos los ganadores
            if (Array.isArray(partido.jugadores)) {
              const ganadoresSet = new Set(Array.isArray(partido.ganadores) ? partido.ganadores : []);
              for (const fid of partido.jugadores) {
                if (!ganadoresSet.has(fid)) {
                  partidosStats[fid] = partidosStats[fid] || { ganados: 0, perdidos: 0 };
                  partidosStats[fid].perdidos++;
                }
              }
            }
          }
        }
      }
    }

    const allFcs = await this.fcRepo.getAllFederados();
    const relacionados = (allFcs || []).filter(x => x.campeonatoID === campeonatoId);

    try {
      const rows = [];
      // Encuentra la última posición disponible
      const posicionesNumericas = Object.values(posiciones).map(Number);
      const ultimaPosicion = posicionesNumericas.length ? Math.max(...posicionesNumericas) : 1;
      for (const fc of relacionados) {
              // Eliminar rankings con tipoDePartido inválido antes de actualizar/crear
              const repo = this.rankingRepo;
              const allRankings = await repo.getByUsuario(fc.federadoID);
              for (const r of allRankings) {
                if (
                  r.temporadaID === camp.temporadaID &&
                  r.deporte === camp.deporte &&
                  r.usuarioID === fc.federadoID &&
                  r.tipoDePartido && !["singles", "dobles"].includes(String(r.tipoDePartido))
                ) {
                  await repo.delete(r.id).catch(()=>{});
                }
              }
        let pos = posiciones[fc.federadoID];
        if (!pos) {
          pos = ultimaPosicion + 1;
        }
        const pts = pos ? this.puntos(camp, pos) : 0;
        let nombre = '';
        try {
          const fed = await this.federadoRepo.getFederadoById(fc.federadoID).catch(() => null);
          if (fed) nombre = `${fed.nombre || ''}${fed.apellido ? ' ' + fed.apellido : ''}`.trim() || fed.displayName || '';
        } catch (err) {}
        rows.push({ federadoID: fc.federadoID, nombre, posicion: pos, puntos: pts });
      }
      rows.sort((a, b) => ((a.posicion || 1e9) - (b.posicion || 1e9)));
      console.log('\n===== Tabla: puntos a asignar al cerrar campeonato =====');
      console.table(rows);
    } catch (e) {
      console.warn('No se pudo generar tabla de puntos a asignar:', e?.message || e);
    }

    const UpsertRankingPuntos = (await import("../Rankings/UpsertRankingPuntos.js")).default;

    for (const fc of relacionados) {
      let pos = posiciones[fc.federadoID];
      if (!pos) {
        const posicionesNumericas = Object.values(posiciones).map(Number);
        const ultimaPosicion = posicionesNumericas.length ? Math.max(...posicionesNumericas) : 1;
        pos = ultimaPosicion + 1;
      }
      const pts = pos ? this.puntos(camp, pos) : 0;
      await this.fcRepo.update(fc.id, { posicionFinal: pos, puntosRanking: pts }).catch(()=>{});
      if (!camp.temporadaID || !camp.deporte || !fc.federadoID) continue;
      const modalidad = camp.dobles ? "dobles" : "singles";
      let genero = "mixto";
      let rawGenero = camp?.requisitosParticipacion?.genero || camp.genero;
      if (rawGenero) {
        const g = String(rawGenero).toLowerCase();
        if (["masculino", "femenino", "mixto"].includes(g)) genero = g;
      }
      const tipoDePartido = camp.dobles ? "dobles" : "singles";
      const repo = this.rankingRepo;
      const allRankings = await repo.getByUsuario(fc.federadoID);
      // Buscar ranking existente por scope (temporada, deporte, tipoDePartido, genero)
      let ranking = allRankings.find(r =>
        String(r.temporadaID) === String(camp.temporadaID) &&
        String(r.deporte).toLowerCase() === String(camp.deporte).toLowerCase() &&
        String(r.tipoDePartido) === tipoDePartido &&
        (r.genero ? String(r.genero).toLowerCase() === String(genero).toLowerCase() : true)
      );
      let prevPuntos = ranking ? ranking.puntos : 0;
      let nuevoPuntos = prevPuntos + pts;
      // Calcular partidos ganados/perdidos en el campeonato
      const ganados = partidosStats[fc.federadoID]?.ganados || 0;
      const perdidos = partidosStats[fc.federadoID]?.perdidos || 0;
      if (ranking) {
        const nuevosGanados = (ranking.partidosGanados || 0) + ganados;
        const nuevosPerdidos = (ranking.partidosPerdidos || 0) + perdidos;
        await repo.update(ranking.id, {
          puntos: nuevoPuntos,
          partidosGanados: nuevosGanados,
          partidosPerdidos: nuevosPerdidos,
          updatedAt: new Date().toISOString(),
          tipoDePartido
        });
        console.log(`[Ranking] Jugador ${fc.federadoID} (${genero}) actualizado: ${prevPuntos} -> ${nuevoPuntos} puntos, ganados: ${nuevosGanados}, perdidos: ${nuevosPerdidos}. [${tipoDePartido}]`);
      } else {
        // Buscar si existe un ranking legacy (sin genero) para migrar
        let legacyRanking = allRankings.find(r =>
          String(r.temporadaID) === String(camp.temporadaID) &&
          String(r.deporte).toLowerCase() === String(camp.deporte).toLowerCase() &&
          String(r.tipoDePartido) === tipoDePartido &&
          (!r.genero || r.genero === null || r.genero === "")
        );
        if (legacyRanking) {
          // Actualizar el ranking legacy con genero y sumar puntos/partidos
          const nuevosGanados = (legacyRanking.partidosGanados || 0) + ganados;
          const nuevosPerdidos = (legacyRanking.partidosPerdidos || 0) + perdidos;
          await repo.update(legacyRanking.id, {
            puntos: (legacyRanking.puntos || 0) + pts,
            partidosGanados: nuevosGanados,
            partidosPerdidos: nuevosPerdidos,
            updatedAt: new Date().toISOString(),
            genero,
            tipoDePartido
          });
          console.log(`[Ranking] Jugador ${fc.federadoID} (legacy->${genero}) actualizado: ${legacyRanking.puntos} -> ${(legacyRanking.puntos || 0) + pts} puntos, ganados: ${nuevosGanados}, perdidos: ${nuevosPerdidos}. [${tipoDePartido}]`);
        } else {
          // Crear nuevo ranking solo si no existe ninguno
          const id = [
            String(camp.temporadaID).toLowerCase(),
            String(fc.federadoID).toLowerCase(),
            String(camp.deporte).toLowerCase(),
            String(genero).toLowerCase(),
            tipoDePartido
          ].filter(Boolean).join("-");
          const model = {
            id,
            temporadaID: camp.temporadaID,
            usuarioID: fc.federadoID,
            deporte: camp.deporte,
            genero,
            tipoDePartido,
            puntos: nuevoPuntos,
            partidosGanados: ganados,
            partidosPerdidos: perdidos,
            partidosAbandonados: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await repo.save(model);
          console.log(`[Ranking] Jugador ${fc.federadoID} (${genero}) creado: ${nuevoPuntos} puntos, ganados: ${ganados}, perdidos: ${perdidos}. [${tipoDePartido}]`);
        }
      }
    }
    return { ok: true, posiciones };
  }


  _posicionesPorVictoriasTodasEtapas(etapas, esDobles) {
    const stats = {};
    const allFederados = new Set();
    for (const etapa of etapas) {
      if (etapa.tipoEtapa === "eliminacion") {
        const rondas = Array.isArray(etapa.rondas) ? etapa.rondas : [];
        for (const r of rondas) {
          for (const p of Array.isArray(r.partidos) ? r.partidos : []) {
            if (p.estado !== "finalizado" && p.estado !== "cerrado") continue;
            if (p.ganadorId) {
              stats[p.ganadorId] = (stats[p.ganadorId] || 0) + 1;
            }
            // Asegura que todos los jugadores del partido estén en el set
            if (Array.isArray(p.jugador1)) {
              for (const j1 of p.jugador1) {
                if (j1 && j1.id) allFederados.add(j1.id);
              }
            } else if (p.jugador1Id) {
              allFederados.add(p.jugador1Id);
            }
            if (Array.isArray(p.jugador2)) {
              for (const j2 of p.jugador2) {
                if (j2 && j2.id) allFederados.add(j2.id);
              }
            } else if (p.jugador2Id) {
              allFederados.add(p.jugador2Id);
            }
          }
        }
      } else if (etapa.tipoEtapa === "roundRobin") {
        const grupos = Array.isArray(etapa.grupos) ? etapa.grupos : [];
        for (const g of grupos) {
          for (const slot of Array.isArray(g.jugadores) ? g.jugadores : []) {
            const federadoIDs = esDobles
              ? (slot.players || []).map(p => p && p.id).filter(Boolean)
              : [slot.id].filter(Boolean);
            for (const fid of federadoIDs) {
              allFederados.add(fid);
            }
          }
          for (const partido of Array.isArray(g.partidos) ? g.partidos : []) {
            if (partido.estado !== "finalizado" && partido.estado !== "cerrado") continue;
            if (Array.isArray(partido.ganadores)) {
              for (const ganadorId of partido.ganadores) {
                stats[ganadorId] = (stats[ganadorId] || 0) + 1;
              }
            }
            // Asegura que todos los jugadores del partido estén en el set
            if (Array.isArray(partido.jugadores)) {
              for (const fid of partido.jugadores) {
                allFederados.add(fid);
              }
            }
          }
        }
      }
    }
    // Asegura que todos los federados tengan stats (aunque sea 0)
    for (const fid of allFederados) {
      if (!(fid in stats)) stats[fid] = 0;
    }
    // Ordena por victorias descendente, luego por federadoID para desempatar
    const lista = Array.from(allFederados).map(fid => ({ fid, victorias: stats[fid] }));
    lista.sort((a, b) => {
      if (b.victorias !== a.victorias) return b.victorias - a.victorias;
      return a.fid.localeCompare(b.fid);
    });
    // Asigna posiciones con saltos en caso de empate (ranking olímpico)
    const map = {};
    let pos = 1;
    let prevVictorias = null;
    let repes = 0;
    for (let i = 0; i < lista.length; i++) {
      const { fid, victorias } = lista[i];
      if (prevVictorias !== null && victorias !== prevVictorias) {
        pos = pos + repes;
        repes = 1;
      } else if (prevVictorias !== null) {
        repes++;
      } else {
        repes = 1;
      }
      map[fid] = pos;
      prevVictorias = victorias;
    }
    return map;
  }
}
