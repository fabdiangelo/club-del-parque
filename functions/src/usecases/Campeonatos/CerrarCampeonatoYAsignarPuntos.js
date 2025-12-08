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
    // Si no hay tabla configurada, usar DEFAULT_TABLA
    let tabla = camp?.puntosPorPosicion;
    if (!tabla || typeof tabla !== 'object' || Object.keys(tabla).length === 0) {
      console.log(`⚠️ Campeonato sin puntosPorPosicion, usando DEFAULT_TABLA`);
      tabla = DEFAULT_TABLA;
    }
    
    let posNum = Number(pos);
    
    // Convertir todas las claves de la tabla a números para comparación
    // JavaScript automáticamente convierte claves numéricas a strings, así que necesitamos normalizarlas
    const tablaNormalizada = {};
    Object.keys(tabla).forEach(k => {
      const key = Number(k);
      const value = Number(tabla[k]);
      if (!isNaN(key) && !isNaN(value)) {
        tablaNormalizada[key] = value;
      }
    });
    
    console.log(`📊 Tabla normalizada:`, tablaNormalizada);
    
    const posiciones = Object.keys(tablaNormalizada).map(Number).sort((a, b) => a - b);
    
    if (posiciones.length === 0) {
      console.log(`❌ Tabla vacía después de normalización`);
      return 0;
    }
    
    // Si la posición está exactamente en la tabla, devolver ese valor
    if (tablaNormalizada[posNum] !== undefined) {
      console.log(`Posición ${posNum}: ${tablaNormalizada[posNum]} puntos (exacta)`);
      return tablaNormalizada[posNum];
    }
    
    // Si la posición es mayor al máximo definido, usar el último valor de la tabla
    if (posNum > Math.max(...posiciones)) {
      const ultimaPosicion = Math.max(...posiciones);
      const puntos = tablaNormalizada[ultimaPosicion];
      console.log(`Posición ${posNum}: ${puntos} puntos (usando última posición ${ultimaPosicion})`);
      return puntos;
    }
    
    // Si la posición es menor al mínimo definido, usar el primer valor
    if (posNum < Math.min(...posiciones)) {
      const primeraPosicion = Math.min(...posiciones);
      const puntos = tablaNormalizada[primeraPosicion];
      console.log(`Posición ${posNum}: ${puntos} puntos (usando primera posición ${primeraPosicion})`);
      return puntos;
    }
    
    console.log(`Posición ${posNum}: 0 puntos (no encontrada)`);
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
    console.log(`🎾 Modo campeonato: ${esDobles ? 'DOBLES' : 'SINGLES'}`);
    
    // Calcular posiciones sumando victorias en todas las etapas
    const posiciones = this._posicionesPorVictoriasTodasEtapas(etapas, esDobles);

    // ✅ CORREGIDO: Calcular partidos ganados y perdidos por federado
    const partidosStats = this._calcularPartidosStats(etapas, esDobles);

    const allFcs = await this.fcRepo.getAllFederados();
    const relacionados = (allFcs || []).filter(x => x.campeonatoID === campeonatoId);

    try {
      const rows = [];
      const posicionesNumericas = Object.values(posiciones).map(Number);
      const ultimaPosicion = posicionesNumericas.length ? Math.max(...posicionesNumericas) : 1;
      
      for (const fc of relacionados) {
        let federadoIDs = [];
        if (esDobles && Array.isArray(fc.federadoID)) {
          federadoIDs = fc.federadoID;
        } else {
          federadoIDs = [fc.federadoID];
        }
        
        for (const federadoID of federadoIDs) {
          // Eliminar rankings con tipoDePartido inválido
          const repo = this.rankingRepo;
          const allRankings = await repo.getByUsuario(federadoID);
          for (const r of allRankings) {
            if (
              r.temporadaID === camp.temporadaID &&
              r.deporte === camp.deporte &&
              r.usuarioID === federadoID &&
              r.tipoDePartido && !["singles", "dobles"].includes(String(r.tipoDePartido))
            ) {
              await repo.delete(r.id).catch(()=>{});
            }
          }
          
          let pos = posiciones[federadoID];
          if (!pos) {
            pos = ultimaPosicion + 1;
          }
          
          const pts = this.puntos(camp, pos);
          let nombre = '';
          try {
            const fed = await this.federadoRepo.getFederadoById(federadoID).catch(() => null);
            if (fed) nombre = `${fed.nombre || ''}${fed.apellido ? ' ' + fed.apellido : ''}`.trim() || fed.displayName || '';
          } catch (err) {}
          
          rows.push({ 
            federadoID, 
            nombre, 
            posicion: pos, 
            puntos: pts,
            ganados: partidosStats[federadoID]?.ganados || 0,
            perdidos: partidosStats[federadoID]?.perdidos || 0
          });
        }
      }
      
      rows.sort((a, b) => ((a.posicion || 1e9) - (b.posicion || 1e9)));
      console.log('\n===== Tabla: puntos a asignar al cerrar campeonato =====');
      console.table(rows);
    } catch (e) {
      console.warn('No se pudo generar tabla de puntos a asignar:', e?.message || e);
    }

    const UpsertRankingPuntos = (await import("../Rankings/UpsertRankingPuntos.js")).default;

    for (const fc of relacionados) {
      let federadoIDs = [];
      if (esDobles && Array.isArray(fc.federadoID)) {
        federadoIDs = fc.federadoID;
      } else {
        federadoIDs = [fc.federadoID];
      }
      
      for (const federadoID of federadoIDs) {
        let pos = posiciones[federadoID];
        if (!pos) {
          const posicionesNumericas = Object.values(posiciones).map(Number);
          const ultimaPosicion = posicionesNumericas.length ? Math.max(...posicionesNumericas) : 1;
          pos = ultimaPosicion + 1;
        }
        
        const pts = this.puntos(camp, pos);
        await this.fcRepo.update(fc.id, { posicionFinal: pos, puntosRanking: pts }).catch(()=>{});
        
        if (!camp.temporadaID || !camp.deporte || !federadoID) continue;
        
        const modalidad = camp.dobles ? "dobles" : "singles";
        let genero = "mixto";
        let rawGenero = camp?.requisitosParticipacion?.genero || camp.genero;
        if (rawGenero) {
          const g = String(rawGenero).toLowerCase();
          if (["masculino", "femenino", "mixto"].includes(g)) genero = g;
        }
        
        const tipoDePartido = camp.dobles ? "dobles" : "singles";
        const repo = this.rankingRepo;
        const allRankings = await repo.getByUsuario(federadoID);
        
        // Buscar ranking existente
        let ranking = allRankings.find(r =>
          String(r.temporadaID) === String(camp.temporadaID) &&
          String(r.deporte).toLowerCase() === String(camp.deporte).toLowerCase() &&
          String(r.tipoDePartido) === tipoDePartido &&
          (r.genero ? String(r.genero).toLowerCase() === String(genero).toLowerCase() : true)
        );
        
        let prevPuntos = ranking ? ranking.puntos : 0;
        const ganados = partidosStats[federadoID]?.ganados || 0;
        const perdidos = partidosStats[federadoID]?.perdidos || 0;
        
        if (ranking) {
          const nuevosGanados = (ranking.partidosGanados || 0) + ganados;
          const nuevosPerdidos = (ranking.partidosPerdidos || 0) + perdidos;
          const nuevoPuntos = prevPuntos + pts;
          
          await repo.update(ranking.id, {
            puntos: nuevoPuntos,
            partidosGanados: nuevosGanados,
            partidosPerdidos: nuevosPerdidos,
            updatedAt: new Date().toISOString(),
            tipoDePartido
          });
          
          console.log(`[Ranking] Jugador ${federadoID} (${genero}) actualizado: ${prevPuntos} -> ${nuevoPuntos} puntos (+${pts}), ganados: ${nuevosGanados}, perdidos: ${nuevosPerdidos}. [${tipoDePartido}]`);
        } else {
          // Buscar ranking legacy
          let legacyRanking = allRankings.find(r =>
            String(r.temporadaID) === String(camp.temporadaID) &&
            String(r.deporte).toLowerCase() === String(camp.deporte).toLowerCase() &&
            String(r.tipoDePartido) === tipoDePartido &&
            (!r.genero || r.genero === null || r.genero === "")
          );
          
          if (legacyRanking) {
            const nuevosGanados = (legacyRanking.partidosGanados || 0) + ganados;
            const nuevosPerdidos = (legacyRanking.partidosPerdidos || 0) + perdidos;
            const nuevosPuntos = (legacyRanking.puntos || 0) + pts;
            
            await repo.update(legacyRanking.id, {
              puntos: nuevosPuntos,
              partidosGanados: nuevosGanados,
              partidosPerdidos: nuevosPerdidos,
              updatedAt: new Date().toISOString(),
              genero,
              tipoDePartido
            });
            
            console.log(`[Ranking] Jugador ${federadoID} (legacy->${genero}) actualizado: ${legacyRanking.puntos} -> ${nuevosPuntos} puntos (+${pts}), ganados: ${nuevosGanados}, perdidos: ${nuevosPerdidos}. [${tipoDePartido}]`);
          } else {
            // Crear nuevo ranking
            const id = [
              String(camp.temporadaID).toLowerCase(),
              String(federadoID).toLowerCase(),
              String(camp.deporte).toLowerCase(),
              String(genero).toLowerCase(),
              tipoDePartido
            ].filter(Boolean).join("-");
            
            const model = {
              id,
              temporadaID: camp.temporadaID,
              usuarioID: federadoID,
              deporte: camp.deporte,
              genero,
              tipoDePartido,
              puntos: pts,
              partidosGanados: ganados,
              partidosPerdidos: perdidos,
              partidosAbandonados: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await repo.save(model);
            console.log(`[Ranking] Jugador ${federadoID} (${genero}) creado: ${pts} puntos, ganados: ${ganados}, perdidos: ${perdidos}. [${tipoDePartido}]`);
          }
        }
      }
    }
    
    return { ok: true, posiciones };
  }

  /**
   * ✅ NUEVO MÉTODO: Calcula estadísticas de partidos de forma más robusta
   */
  _calcularPartidosStats(etapas, esDobles) {
    const stats = {};
    
    for (const etapa of etapas) {
      if (etapa.tipoEtapa === "eliminacion") {
        const rondas = Array.isArray(etapa.rondas) ? etapa.rondas : [];
        for (const r of rondas) {
          for (const p of Array.isArray(r.partidos) ? r.partidos : []) {
            if (p.estado !== "finalizado" && p.estado !== "cerrado") continue;
            
            // Extraer IDs de ganadores y todos los jugadores del partido
            let ganadoresIds = [];
            let todosJugadores = [];
            
            if (esDobles) {
              // Ganadores en dobles
              if (Array.isArray(p.ganadorId)) {
                ganadoresIds = p.ganadorId.map(id => String(id));
              } else if (Array.isArray(p.ganadores)) {
                ganadoresIds = p.ganadores.map(id => String(id));
              }
              
              // Todos los jugadores del partido
              if (Array.isArray(p.jugador1)) {
                todosJugadores.push(...p.jugador1.map(j => String(j?.id)).filter(Boolean));
              }
              if (Array.isArray(p.jugador2)) {
                todosJugadores.push(...p.jugador2.map(j => String(j?.id)).filter(Boolean));
              }
            } else {
              // Singles
              if (p.ganadorId) {
                ganadoresIds = [String(p.ganadorId)];
              } else if (Array.isArray(p.ganadores) && p.ganadores.length) {
                ganadoresIds = [String(p.ganadores[0])];
              }
              
              if (p.jugador1Id) todosJugadores.push(String(p.jugador1Id));
              if (p.jugador2Id) todosJugadores.push(String(p.jugador2Id));
            }
            
            // Inicializar stats para todos los jugadores
            for (const jId of todosJugadores) {
              if (!stats[jId]) {
                stats[jId] = { ganados: 0, perdidos: 0 };
              }
            }
            
            // Asignar victorias
            for (const gId of ganadoresIds) {
              if (stats[gId]) {
                stats[gId].ganados++;
              }
            }
            
            // Asignar derrotas (todos menos los ganadores)
            const ganadoresSet = new Set(ganadoresIds);
            for (const jId of todosJugadores) {
              if (!ganadoresSet.has(jId) && stats[jId]) {
                stats[jId].perdidos++;
              }
            }
          }
        }
      } else if (etapa.tipoEtapa === "roundRobin") {
        const grupos = Array.isArray(etapa.grupos) ? etapa.grupos : [];
        for (const g of grupos) {
          for (const partido of Array.isArray(g.partidos) ? g.partidos : []) {
            if (partido.estado !== "finalizado" && partido.estado !== "cerrado") continue;
            
            let ganadoresIds = [];
            let todosJugadores = [];
            
            // Extraer ganadores
            if (Array.isArray(partido.ganadores)) {
              ganadoresIds = partido.ganadores.map(id => String(id));
            }
            
            // Extraer todos los jugadores
            if (Array.isArray(partido.jugadores)) {
              todosJugadores = partido.jugadores.map(id => String(id));
            }
            
            // Inicializar stats
            for (const jId of todosJugadores) {
              if (!stats[jId]) {
                stats[jId] = { ganados: 0, perdidos: 0 };
              }
            }
            
            // Asignar victorias
            for (const gId of ganadoresIds) {
              if (stats[gId]) {
                stats[gId].ganados++;
              }
            }
            
            // Asignar derrotas
            const ganadoresSet = new Set(ganadoresIds);
            for (const jId of todosJugadores) {
              if (!ganadoresSet.has(jId) && stats[jId]) {
                stats[jId].perdidos++;
              }
            }
          }
        }
      }
    }
    
    return stats;
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
            
            // Contar victorias
            if (esDobles && Array.isArray(p.ganadorId)) {
              for (const gid of p.ganadorId) {
                stats[gid] = (stats[gid] || 0) + 1;
              }
            } else if (p.ganadorId) {
              stats[p.ganadorId] = (stats[p.ganadorId] || 0) + 1;
            }
            
            // Registrar todos los jugadores
            if (esDobles) {
              if (Array.isArray(p.jugador1)) {
                for (const j1 of p.jugador1) {
                  if (j1 && j1.id) allFederados.add(j1.id);
                }
              }
              if (Array.isArray(p.jugador2)) {
                for (const j2 of p.jugador2) {
                  if (j2 && j2.id) allFederados.add(j2.id);
                }
              }
            } else {
              if (p.jugador1Id) allFederados.add(p.jugador1Id);
              if (p.jugador2Id) allFederados.add(p.jugador2Id);
            }
          }
        }
      } else if (etapa.tipoEtapa === "roundRobin") {
        const grupos = Array.isArray(etapa.grupos) ? etapa.grupos : [];
        for (const g of grupos) {
          // Registrar jugadores del grupo
          for (const slot of Array.isArray(g.jugadores) ? g.jugadores : []) {
            const federadoIDs = esDobles
              ? (slot.players || []).map(p => p && p.id).filter(Boolean)
              : [slot.id].filter(Boolean);
            for (const fid of federadoIDs) {
              allFederados.add(fid);
            }
          }
          
          // Contar victorias
          for (const partido of Array.isArray(g.partidos) ? g.partidos : []) {
            if (partido.estado !== "finalizado" && partido.estado !== "cerrado") continue;
            
            if (Array.isArray(partido.ganadores)) {
              for (const ganadorId of partido.ganadores) {
                stats[ganadorId] = (stats[ganadorId] || 0) + 1;
              }
            }
            
            // Registrar jugadores del partido
            if (Array.isArray(partido.jugadores)) {
              for (const fid of partido.jugadores) {
                allFederados.add(fid);
              }
            }
          }
        }
      }
    }
    
    // Asegurar que todos tengan stats
    for (const fid of allFederados) {
      if (!(fid in stats)) stats[fid] = 0;
    }
    
    // Ordenar y asignar posiciones
    const lista = Array.from(allFederados).map(fid => ({ fid, victorias: stats[fid] }));
    lista.sort((a, b) => {
      if (b.victorias !== a.victorias) return b.victorias - a.victorias;
      return String(a.fid).localeCompare(String(b.fid));
    });
    
    // Asignar posiciones con saltos en caso de empate (ranking olímpico)
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