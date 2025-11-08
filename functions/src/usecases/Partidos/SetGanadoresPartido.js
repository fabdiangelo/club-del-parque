import { applyOnCreate, applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import CerrarCampeonatoYAsignarPuntos from "../Campeonatos/CerrarCampeonatoYAsignarPuntos.js";

export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
    this.etapaRepository = new EtapaRepository();
    this.campeonatoRepository = new CampeonatoRepository();
    this.federadoRepository = new FederadoRepository();
    this._internalPartidoRepo = this.partidoRepo || new PartidoRepository();
  }

  async execute(partidoId, ganadores = [], resultado = null, puntosGanador, puntosPerdedor) {
    console.log(`\n========== FINALIZANDO PARTIDO ${partidoId} ==========`);
    const oldPartido = await this.partidoRepo.getById(partidoId);
    if (!oldPartido) throw new Error("Partido no encontrado");

    const uniq = (arr = []) => Array.from(new Set((arr || []).map((v) => String(v).trim())));

    const updated = {
      ...oldPartido,
      ganadores: uniq(ganadores),
      resultado: resultado ?? oldPartido.resultado,
      estado: "finalizado",
    };

    console.log(`Ganadores: ${updated.ganadores.join(', ')}`);

    // Persist partido finalizado
    await this.partidoRepo.update(partidoId, updated);

    // Actualizar rankings / puntos de temporada (si aplica)
    try {
      await applyOnEdit(oldPartido, updated, puntosGanador, puntosPerdedor);
    } catch (e) {
      console.warn('Error aplicando rankings desde SetGanadoresPartido:', e?.message || e);
    }

    // Actualizar etapa asociada
    try {
      if (updated.etapa) {
        const etapa = await this.etapaRepository.findById(updated.etapa);
        if (etapa) {
          console.log(`Etapa: ${etapa.nombre} (${etapa.tipoEtapa})`);
          const campeonato = etapa.campeonatoID ? await this.campeonatoRepository.findById(etapa.campeonatoID) : null;
          const puntosPorPosicion = campeonato?.puntosPorPosicion ?? 3;

          // ROUND ROBIN
          if (etapa.tipoEtapa === 'roundRobin' && updated.meta && updated.meta.grupoID) {
            await this._handleRoundRobinMatch(updated, etapa, campeonato, puntosPorPosicion);
          }

          // ELIMINACION
          if (etapa.tipoEtapa === 'eliminacion' && updated.meta && updated.meta.rondaID) {
            await this._handleEliminationMatch(updated, etapa, campeonato);
          }
        }
      }
    } catch (e) {
      console.warn('Error actualizando etapa desde SetGanadoresPartido:', e?.message || e);
      console.error(e);
    }

    console.log(`========== FIN PROCESAMIENTO PARTIDO ==========\n`);
    return updated;
  }

  /**
   * Helper function to get player name from federado
   */
  async _getFederadoName(playerId) {
    try {
      const fed = await this.federadoRepository.getFederadoById(playerId).catch(() => null);
      if (!fed) return '';
      return `${fed.nombre || ''}${fed.apellido ? ' ' + fed.apellido : ''}`.trim() || (fed.displayName || '');
    } catch (e) {
      return '';
    }
  }

  /**
   * Helper function to get full federado data
   */
  async _getFederadoData(playerId, campeonato = null) {
    try {
      // First try from campeonato.federados if available
      if (campeonato && Array.isArray(campeonato.federados)) {
        const federado = campeonato.federados.find(f => String(f.id) === String(playerId));
        if (federado) {
          return { id: federado.id, nombre: federado.nombre, club: federado.club };
        }
      }

      // Fallback to repository
      const fed = await this.federadoRepository.getFederadoById(playerId).catch(() => null);
      if (fed) {
        return {
          id: fed.id,
          nombre: `${fed.nombre || ''}${fed.apellido ? ' ' + fed.apellido : ''}`.trim() || (fed.displayName || ''),
          club: fed.club
        };
      }

      return { id: playerId };
    } catch (e) {
      return { id: playerId };
    }
  }

  /**
   * Maneja la lógica de un partido de Round Robin
   */
async _handleRoundRobinMatch(updated, etapa, campeonato, puntosPorPosicion) {
  console.log(`Procesando partido Round Robin en grupo ${updated.meta.grupoID}`);
  const grupo = (etapa.grupos || []).find(g => g.id === updated.meta.grupoID);
  if (!grupo) {
    console.warn('Grupo no encontrado');
    return;
  }

  // Actualizar partido en la estructura de la etapa
  const partidoInGrupo = (grupo.partidos || []).find((p) => {
    if (typeof p.jugador1Index !== 'undefined' && typeof p.jugador2Index !== 'undefined') {
      if (
        (p.jugador1Index === updated.meta?.jugador1Index && p.jugador2Index === updated.meta?.jugador2Index) ||
        (p.jugador1Index === updated.meta?.jugador2Index && p.jugador2Index === updated.meta?.jugador1Index)
      ) {
        return true;
      }
    }

    const rawFromUpdated = String(updated.id || '').replace(`${etapa.id}-${grupo.id}-`, '');
    if (String(p.id) === String(updated.id)) return true;
    if (String(p.id) === rawFromUpdated) return true;
    if (String(updated.id).endsWith(`-${p.id}`)) return true;
    return false;
  });

  if (partidoInGrupo) {
    // ✅ SINCRONIZAR TODOS LOS CAMPOS
    if (Array.isArray(updated.jugador1) && updated.jugador1.length > 0) {
      partidoInGrupo.jugador1 = updated.jugador1.map(j => ({
        id: j.id,
        nombre: j.nombre,
        club: j.club
      }));
    }
    if (Array.isArray(updated.jugador2) && updated.jugador2.length > 0) {
      partidoInGrupo.jugador2 = updated.jugador2.map(j => ({
        id: j.id,
        nombre: j.nombre,
        club: j.club
      }));
    }
    if (updated.jugador1Id) partidoInGrupo.jugador1Id = updated.jugador1Id;
    if (updated.jugador2Id) partidoInGrupo.jugador2Id = updated.jugador2Id;
    
    partidoInGrupo.estado = updated.estado;
    
    // Copiar resultado completo
    if (updated.resultado) {
      partidoInGrupo.resultado = JSON.parse(JSON.stringify(updated.resultado));
    }
    
    // Copiar sets
    if (updated.resultado && Array.isArray(updated.resultado.sets)) {
      partidoInGrupo.sets = JSON.parse(JSON.stringify(updated.resultado.sets));
    }
    
    // Sincronizar ganadores
    if (updated.ganadores) {
      partidoInGrupo.ganadores = Array.isArray(updated.ganadores)
        ? updated.ganadores.map(g => String(g))
        : [String(updated.ganadores)];
    }
    
    // Sincronizar fechas
    if (updated.fechaProgramada) {
      partidoInGrupo.fechaProgramada = updated.fechaProgramada;
    }
    if (updated.fechaJugado) {
      partidoInGrupo.fechaJugado = updated.fechaJugado;
    } else if (updated.estado === 'finalizado' && !partidoInGrupo.fechaJugado) {
      partidoInGrupo.fechaJugado = new Date().toISOString();
    }

    // Actualizar estadísticas de grupo
    await this._updateGroupStats(partidoInGrupo, grupo, updated, puntosPorPosicion);
  }

  // Guardar etapa actualizada
  await this.etapaRepository.save({ id: etapa.id, ...etapa });

  // Verificar si el grupo está completo
  const grupoCompletado = this._isGroupComplete(grupo);
  console.log(`Grupo ${grupo.id} completado: ${grupoCompletado}`);
  
  if (grupoCompletado) {
    console.log(`✓ Grupo ${grupo.id} completado. Verificando todos los grupos...`);
    
    const todosGruposCompletos = (etapa.grupos || []).every(g => {
      const completo = this._isGroupComplete(g);
      console.log(`  - Grupo ${g.id}: ${completo ? 'COMPLETO ✓' : 'PENDIENTE ⏳'}`);
      return completo;
    });
    
    console.log(`\n¿Todos los grupos completos? ${todosGruposCompletos ? 'SÍ ✓' : 'NO ✗'}\n`);
    
    if (todosGruposCompletos) {
      console.log('🎯 TODOS LOS GRUPOS COMPLETADOS. Promoviendo jugadores...');
      await this._promoteRoundRobinWinners(etapa, campeonato);
    }
  }
}

  /**
   * Actualiza las estadísticas de un grupo tras finalizar un partido
   */
  async _updateGroupStats(partidoInGrupo, grupo, updated, puntosPorPosicion) {
    const winners = updated.ganadores || [];
    const idx1 = partidoInGrupo.jugador1Index;
    const idx2 = partidoInGrupo.jugador2Index;
    
    if (typeof idx1 === 'undefined' || typeof idx2 === 'undefined') return;

    const slot1 = grupo.jugadores[idx1];
    const slot2 = grupo.jugadores[idx2];

    // Determinar ganador
    let ganadorLado = null;
    if (Array.isArray(updated.jugador1) && updated.jugador1.length) {
      const j1ids = updated.jugador1.map(x => String(x?.id));
      if (winners.some(w => j1ids.includes(String(w)))) ganadorLado = 1;
    }
    if (Array.isArray(updated.jugador2) && updated.jugador2.length) {
      const j2ids = updated.jugador2.map(x => String(x?.id));
      if (winners.some(w => j2ids.includes(String(w)))) ganadorLado = 2;
    }

    // Singles
    if (!Array.isArray(slot1?.players) && !Array.isArray(slot2?.players)) {
      if (winners && winners.length) {
        if (String(slot1?.id) === String(winners[0])) {
          slot1.ganados = (slot1.ganados || 0) + 1;
          slot1.puntos = (slot1.puntos || 0) + puntosPorPosicion;
          slot2.perdidos = (slot2.perdidos || 0) + 1;
        } else if (String(slot2?.id) === String(winners[0])) {
          slot2.ganados = (slot2.ganados || 0) + 1;
          slot2.puntos = (slot2.puntos || 0) + puntosPorPosicion;
          slot1.perdidos = (slot1.perdidos || 0) + 1;
        }
      }
    } else {
      // Dobles
      if (ganadorLado === 1) {
        slot1.ganados = (slot1.ganados || 0) + 1;
        slot1.puntos = (slot1.puntos || 0) + puntosPorPosicion;
        slot2.perdidos = (slot2.perdidos || 0) + 1;
      } else if (ganadorLado === 2) {
        slot2.ganados = (slot2.ganados || 0) + 1;
        slot2.puntos = (slot2.puntos || 0) + puntosPorPosicion;
        slot1.perdidos = (slot1.perdidos || 0) + 1;
      }
    }

    // Actualizar sets y juegos
    try {
      const res = updated.resultado || {};
      let sets1 = 0, sets2 = 0, juegos1 = 0, juegos2 = 0;
      if (Array.isArray(res.sets)) {
        for (const s of res.sets) {
          const a = Number(s.jugador1 ?? s.local ?? s[0]);
          const b = Number(s.jugador2 ?? s.visitante ?? s[1]);
          if (!isNaN(a) && !isNaN(b)) {
            juegos1 += a;
            juegos2 += b;
            if (a > b) sets1++;
            else if (b > a) sets2++;
          }
        }
      }

      if (slot1 && slot2) {
        slot1.setsGanados = (slot1.setsGanados || 0) + sets1;
        slot1.setsPerdidos = (slot1.setsPerdidos || 0) + sets2;
        slot2.setsGanados = (slot2.setsGanados || 0) + sets2;
        slot2.setsPerdidos = (slot2.setsPerdidos || 0) + sets1;
        slot1.juegosGanados = (slot1.juegosGanados || 0) + juegos1;
        slot1.juegosPerdidos = (slot1.juegosPerdidos || 0) + juegos2;
        slot2.juegosGanados = (slot2.juegosGanados || 0) + juegos2;
        slot2.juegosPerdidos = (slot2.juegosPerdidos || 0) + juegos1;
      }
    } catch (e) {
      // Ignorar errores en formato de resultado
    }

    // Recalcular posiciones del grupo
    this._recalculateGroupPositions(grupo);
  }

  /**
   * Recalcula las posiciones dentro de un grupo
   */
  _recalculateGroupPositions(grupo) {
    try {
      const ranking = (grupo.jugadores || [])
        .map((s, idx) => ({ slot: s, idx }))
        .sort((a, b) => {
          const A = a.slot || {};
          const B = b.slot || {};
          if ((B.puntos || 0) !== (A.puntos || 0)) return (B.puntos || 0) - (A.puntos || 0);
          if ((B.ganados || 0) !== (A.ganados || 0)) return (B.ganados || 0) - (A.ganados || 0);
          const aSets = Number(A.setsGanados || 0) - Number(A.setsPerdidos || 0);
          const bSets = Number(B.setsGanados || 0) - Number(B.setsPerdidos || 0);
          if (bSets !== aSets) return bSets - aSets;
          const aJ = Number(A.juegosGanados || 0) - Number(A.juegosPerdidos || 0);
          const bJ = Number(B.juegosGanados || 0) - Number(B.juegosPerdidos || 0);
          return bJ - aJ;
        });

      for (let i = 0; i < ranking.length; i++) {
        const originalIdx = ranking[i].idx;
        const slot = grupo.jugadores[originalIdx];
        if (slot) slot.posicion = i + 1;
      }
    } catch (err) {
      console.warn('Error calculando ranking de grupo:', err?.message || err);
    }
  }

  /**
   * Verifica si un grupo está completo (todos los partidos jugables finalizados)
   */
  _isGroupComplete(grupo) {
    const result = (grupo.partidos || []).every(p => {
      // Si ya está finalizado, cuenta como completo
      if (p.estado === 'finalizado' || p.estado === 'omitido' || (p.ganadores && p.ganadores.length)) return true;

      // Verificar si tiene ambos jugadores
      const hasPlayer1 = this._hasPlayer(p, grupo, 'jugador1');
      const hasPlayer2 = this._hasPlayer(p, grupo, 'jugador2');

      // Si falta algún jugador, el partido se considera "completo" (no jugable)
      if (!hasPlayer1 || !hasPlayer2) return true;

      return false;
    });

    // Debug de partidos pendientes
    const pendientes = (grupo.partidos || []).filter(p => {
      if (p.estado === 'finalizado' || p.estado === 'omitido') return false;
      const hasPlayer1 = this._hasPlayer(p, grupo, 'jugador1');
      const hasPlayer2 = this._hasPlayer(p, grupo, 'jugador2');
      return hasPlayer1 && hasPlayer2;
    });

    if (pendientes.length > 0) {
      console.log(`  Grupo ${grupo.id} tiene ${pendientes.length} partidos pendientes`);
    }

    return result;
  }

  /**
   * Verifica si un partido tiene un jugador válido en una posición
   */
  _hasPlayer(partido, grupo, side) {
    const indexKey = side === 'jugador1' ? 'jugador1Index' : 'jugador2Index';
    const idKey = side === 'jugador1' ? 'jugador1Id' : 'jugador2Id';
    const arrayKey = side === 'jugador1' ? 'jugador1' : 'jugador2';

    // Verificar por ID directo
    if (partido[idKey]) return true;

    // Verificar por array de jugadores
    if (Array.isArray(partido[arrayKey]) && partido[arrayKey].length && partido[arrayKey][0]?.id) return true;

    // Verificar por índice en grupo
    if (typeof partido[indexKey] !== 'undefined' && grupo.jugadores) {
      const slot = grupo.jugadores[partido[indexKey]];
      if (!slot) return false;

      // Singles: verificar slot.id
      if (slot.id && !slot.id.startsWith('equipo-')) return true;

      // Dobles: verificar slot.players
      if (Array.isArray(slot.players) && slot.players[0]?.id) return true;
    }

    return false;
  }

  /**
   * Promueve a los ganadores de Round Robin a la siguiente etapa
   */
  async _promoteRoundRobinWinners(etapa, campeonato) {
    console.log('\n========== PROMOCIÓN DE JUGADORES ==========');
    if (!campeonato || !Array.isArray(campeonato.etapasIDs)) {
      console.warn('No hay campeonato o etapas definidas');
      return;
    }

    const etapaIndex = campeonato.etapasIDs.indexOf(etapa.id);
    console.log(`Etapa actual índice: ${etapaIndex} de ${campeonato.etapasIDs.length}`);
    
    const nextEtapaId = campeonato.etapasIDs[etapaIndex + 1];
    
    if (!nextEtapaId) {
      console.log('✓ No hay siguiente etapa. Campeonato finalizado.');

      // Al finalizar la última etapa del campeonato, distribuir puntos de ranking
      try {
        const campId = (campeonato && (campeonato.id || campeonato._id)) || etapa.campeonatoID || null;
        if (campId) {
          console.log(`Asignando puntos de ranking para campeonato ${campId}...`);
          // Ejecutar el usecase que cierra el campeonato y asigna puntos
          await new CerrarCampeonatoYAsignarPuntos().execute(campId).catch((e) => {
            console.warn('Error al asignar puntos al cerrar campeonato:', e?.message || e);
          });
          console.log('Puntos de ranking distribuidos.');
        } else {
          console.warn('No se encontró ID de campeonato para asignar puntos');
        }
      } catch (e) {
        console.warn('Error ejecutando asignación de puntos al finalizar campeonato:', e?.message || e);
      }

      return;
    }

    console.log(`Siguiente etapa ID: ${nextEtapaId}`);
    const nextEtapa = await this.etapaRepository.findById(nextEtapaId).catch(() => null);
    if (!nextEtapa) {
      console.warn('No se pudo cargar la siguiente etapa');
      return;
    }

    console.log(`Siguiente etapa: ${nextEtapa.nombre} (${nextEtapa.tipoEtapa})`);

    const gruposCount = (etapa.grupos || []).length || 1;
    const totalAdvance = etapa.cantidadDeJugadoresFin || 2;
    const advanceCount = Math.max(1, Math.ceil(totalAdvance / gruposCount));

    console.log(`Total a clasificar: ${totalAdvance}`);
    console.log(`Por grupo: ${advanceCount} jugador(es)`);

    // Recopilar todos los clasificados de todos los grupos
    const allAdvancing = [];
    for (const grupo of etapa.grupos || []) {
      console.log(`\nProcesando clasificados del ${grupo.id}:`);
      const slots = (grupo.jugadores || []).filter(s => s && (s.id || (s.players && s.players[0]?.id)));
      slots.sort((a, b) => (a.posicion || 999) - (b.posicion || 999));
      
      console.log('Ranking del grupo:');
      slots.forEach((s, idx) => {
        const playerId = s.id || (s.players && s.players[0]?.id);
        console.log(`  ${s.posicion}º - ${playerId} (${s.puntos || 0} pts, ${s.ganados || 0}W-${s.perdidos || 0}L)`);
      });
      
      const advancing = slots.slice(0, advanceCount).map(s => {
        if (s.id && !s.id.startsWith('equipo-')) return { id: s.id, fromGroup: grupo.id };
        if (s.players && s.players[0]?.id) return { id: s.players[0].id, fromGroup: grupo.id };
        return null;
      }).filter(Boolean);

      console.log(`Clasifican: ${advancing.map(a => a.id).join(', ')}`);
      allAdvancing.push(...advancing);
    }

    console.log(`\n✅ Total de jugadores clasificados: ${allAdvancing.length}`);
    console.log(`Jugadores: ${allAdvancing.map(a => a.id).join(', ')}\n`);

    if (allAdvancing.length === 0) {
      console.warn('⚠️ No hay jugadores para promover');
      return;
    }

    // Asignar en la siguiente etapa
    if (nextEtapa.tipoEtapa === 'roundRobin') {
      console.log('Asignando a siguiente etapa Round Robin...');
      await this._assignToRoundRobin(nextEtapa, allAdvancing, campeonato);
    } else if (nextEtapa.tipoEtapa === 'eliminacion') {
      console.log('Asignando a siguiente etapa Eliminación...');
      await this._assignToElimination(nextEtapa, allAdvancing, campeonato);
    }

    console.log('========== FIN PROMOCIÓN ==========\n');
  }

  /**
   * Asigna jugadores clasificados a una etapa de Round Robin
   */
  async _assignToRoundRobin(nextEtapa, advancing, campeonato) {
    let asignados = 0;
    for (const adv of advancing) {
      const playerId = (typeof adv === 'string') ? adv : (adv && adv.id) || null;
      if (!playerId) continue;

      // Get player name
      const playerName = await this._getFederadoName(playerId);
      
      let placed = false;
      for (const ng of nextEtapa.grupos || []) {
        for (let si = 0; si < (ng.jugadores || []).length && !placed; si++) {
          const slot = ng.jugadores[si];
          const isEmpty = this._isSlotEmpty(slot);

          if (isEmpty) {
            console.log(`  Asignando ${playerId} (${playerName}) al ${ng.id} slot ${si}`);
            // Colocar jugador
            if (slot && Array.isArray(slot.players)) {
              slot.players[0] = { id: playerId, nombre: playerName };
            } else if (slot) {
              slot.id = playerId;
              slot.nombre = playerName;
            }
            slot.posicion = slot.posicion || (si + 1);

            // Actualizar partidos relacionados
            await this._updateGroupMatchesForPlayer(nextEtapa, ng, si, playerId, campeonato);

            // Registrar en federadoPartidosIDs
            await this._addMatchesToFederado(nextEtapa, ng, playerId);

            placed = true;
            asignados++;
            break;
          }
        }
        if (placed) break;
      }
      if (!placed) {
        console.warn(`⚠️ No se pudo asignar slot para ${playerId}`);
      }
    }

    console.log(`✓ ${asignados} jugadores asignados a Round Robin`);
    await this.etapaRepository.save({ id: nextEtapa.id, ...nextEtapa });
  }

  /**
   * Asigna jugadores clasificados a una etapa de Eliminación
   */
  async _assignToElimination(nextEtapa, advancing, campeonato) {
    try {
      const firstR = (nextEtapa.rondas || [])[0];
      if (!firstR) {
        console.warn('No hay primera ronda en eliminación');
        return;
      }

      const partidos = firstR.partidos || [];
      const totalSlots = partidos.length * 2;
      console.log(`Primera ronda: ${firstR.nombre} con ${partidos.length} partidos => ${totalSlots} slots`);

      // Construir mapping por grupo: { groupId: [playerId,...] }
      const groupMap = {};
      const unknownKey = '__unknown__';
      for (const adv of advancing) {
        const playerId = (typeof adv === 'string') ? adv : (adv && adv.id) || null;
        const groupId = (typeof adv === 'object' && adv && adv.fromGroup) ? adv.fromGroup : unknownKey;
        if (!playerId) continue;
        if (!groupMap[groupId]) groupMap[groupId] = [];
        groupMap[groupId].push(playerId);
      }

      // Flatten players picking round-robin across groups to interleave same-group players
      const groupKeys = Object.keys(groupMap);
      const totalPlayers = groupKeys.reduce((s, k) => s + (groupMap[k]?.length || 0), 0);
      if (totalPlayers === 0) {
        console.warn('⚠️ No hay jugadores para asignar en eliminación');
        return;
      }

      const interleaved = [];
      let remaining = true;
      while (interleaved.length < totalPlayers && remaining) {
        remaining = false;
        for (const k of groupKeys) {
          const arr = groupMap[k];
          if (arr && arr.length) {
            interleaved.push(arr.shift());
            remaining = true;
            if (interleaved.length >= totalPlayers) break;
          }
        }
      }

      // Determine position order: outer-inner (0,last,1,last-1,2,last-2...)
      const order = [];
      let l = 0, r = totalSlots - 1;
      while (l <= r) {
        order.push(l);
        if (l !== r) order.push(r);
        l++; r--;
      }

      // Assign players to slots based on interleaved order and outer-inner positions
      let asignados = 0;
      for (let i = 0; i < interleaved.length && i < order.length; i++) {
        const playerId = interleaved[i];
        const pos = order[i];
        const partidoIndex = Math.floor(pos / 2);
        const isJugador1 = (pos % 2) === 0;
        const p = partidos[partidoIndex];
        if (!p) continue;

        const targetId = `${nextEtapa.id}-${firstR.id}-${p.id}`;
        const partidoToUpdate = await this._internalPartidoRepo.getById(targetId).catch(() => null);
        if (!partidoToUpdate) {
          console.warn(`Partido ${targetId} no encontrado al asignar ${playerId}`);
          continue;
        }

        try {
          // Get player data with name
          const federadoData = await this._getFederadoData(playerId, campeonato);
          const playerName = federadoData.nombre || await this._getFederadoName(playerId);

          if (isJugador1) {
            // asignar a jugador1
            if (Array.isArray(partidoToUpdate.jugador1)) {
              partidoToUpdate.jugador1 = [{ ...federadoData, nombre: playerName }];
              partidoToUpdate.equipoLocal = [federadoData.id];
            } else {
              partidoToUpdate.jugador1Id = federadoData.id;
              partidoToUpdate.jugador1 = { ...federadoData, nombre: playerName };
            }
            partidoToUpdate.jugador1Nombre = playerName;
            p.jugador1Id = partidoToUpdate.jugador1Id || null;
            p.jugador1 = partidoToUpdate.jugador1 || null;
            console.log(`  Asignando ${playerId} (${playerName}) a ${targetId} (jugador1)`);
          } else {
            // asignar a jugador2
            if (Array.isArray(partidoToUpdate.jugador2)) {
              partidoToUpdate.jugador2 = [{ id: playerId, nombre: playerName }];
              partidoToUpdate.equipoVisitante = [String(playerId)];
            } else {
              partidoToUpdate.jugador2Id = playerId;
              partidoToUpdate.jugador2 = { id: playerId, nombre: playerName };
            }
            partidoToUpdate.jugador2Nombre = playerName;
            p.jugador2Id = partidoToUpdate.jugador2Id || null;
            p.jugador2 = partidoToUpdate.jugador2 || null;
            console.log(`  Asignando ${playerId} (${playerName}) a ${targetId} (jugador2)`);
          }

          partidoToUpdate.estado = 'pendiente';
          delete partidoToUpdate.ganadores;
          delete partidoToUpdate.ganadorId;

          await this._internalPartidoRepo.update(targetId, partidoToUpdate).catch(() => {});

          // Añadir partido al federado
          await this._addMatchesToFederado(nextEtapa, { partidos: [p] }, playerId, firstR);

          asignados++;
        } catch (e) {
          console.warn(`Error asignando ${playerId} a ${targetId}:`, e?.message || e);
        }
      }

      console.log(`✓ ${asignados} jugadores asignados a Eliminación`);
      await this.etapaRepository.save({ id: nextEtapa.id, ...nextEtapa });
    } catch (e) {
      console.warn('Error en _assignToElimination:', e?.message || e);
    }
  }

  /**
   * Verifica si un slot está vacío
   */
  _isSlotEmpty(slot) {
    if (!slot) return true;
    if (slot.id && slot.id.startsWith('equipo-')) {
      return slot.players && slot.players.every(p => !p.id);
    }
    return !slot.id;
  }

  /**
   * Actualiza los partidos de un grupo cuando se asigna un jugador
   */
  async _updateGroupMatchesForPlayer(etapa, grupo, slotIndex, playerId, campeonato) {
    if (!Array.isArray(grupo.partidos)) return;

    // Get player data once
    const federadoData = await this._getFederadoData(playerId, campeonato);
    const playerName = federadoData.nombre || await this._getFederadoName(playerId);

    for (const p of grupo.partidos) {
      if (p.jugador1Index === slotIndex || p.jugador2Index === slotIndex) {
        const targetId = `${etapa.id}-${grupo.id}-${p.id}`;
        const partidoToUpdate = await this._internalPartidoRepo.getById(targetId).catch(() => null);
        if (!partidoToUpdate) continue;

        if (p.jugador1Index === slotIndex) {
          if (Array.isArray(partidoToUpdate.jugador1)) {
            partidoToUpdate.jugador1 = [{ ...federadoData, nombre: playerName }];
            partidoToUpdate.equipoLocal = [federadoData.id];
          } else {
            partidoToUpdate.jugador1Id = federadoData.id;
            partidoToUpdate.jugador1 = { ...federadoData, nombre: playerName };
          }
          partidoToUpdate.jugador1Nombre = playerName;
          p.jugador1Id = playerId;
          p.jugador1 = { ...federadoData, nombre: playerName };
        }

        if (p.jugador2Index === slotIndex) {
          if (Array.isArray(partidoToUpdate.jugador2)) {
            partidoToUpdate.jugador2 = [{ id: playerId, nombre: playerName }];
            partidoToUpdate.equipoVisitante = [String(playerId)];
          } else {
            partidoToUpdate.jugador2Id = playerId;
            partidoToUpdate.jugador2 = { id: playerId, nombre: playerName };
          }
          partidoToUpdate.jugador2Nombre = playerName;
          p.jugador2Id = playerId;
          p.jugador2 = { id: playerId, nombre: playerName };
        }

        // Asegurarnos de que el partido se muestre como pendiente y sin ganadores al asignar desde promoción
        partidoToUpdate.estado = 'pendiente';
        delete partidoToUpdate.ganadores;
        delete partidoToUpdate.ganadorId;

        await this._internalPartidoRepo.update(targetId, partidoToUpdate).catch((err) => {
          console.warn(`Error actualizando partido ${targetId}:`, err?.message);
        });
      }
    }
  }

  /**
   * Añade los IDs de partidos al federado
   */
  async _addMatchesToFederado(etapa, grupo, playerId, ronda = null, campeonato = null) {
    try {
      const fed = await this.federadoRepository.getFederadoById(playerId).catch(() => null);
      if (!fed) return;

      const pidList = Array.isArray(fed.federadoPartidosIDs) ? fed.federadoPartidosIDs.slice() : [];

      if (ronda) {
        // Para eliminación: comparar como strings para evitar problemas de tipo
        const newPids = (ronda.partidos || [])
          .filter(p => String(p.jugador1Id) === String(playerId) || String(p.jugador2Id) === String(playerId))
          .map(p => `${etapa.id}-${ronda.id}-${p.id}`);
        for (const np of newPids) {
          if (!pidList.includes(np)) pidList.push(np);
        }
      } else {
        // Para round robin: si se pasó un grupo completo, filtrar sólo partidos donde aparezca el jugador
        if (Array.isArray(grupo.partidos)) {
          const newPids = (grupo.partidos || [])
            .filter(p => {
              // Puede haber índices o ids en la estructura; aceptamos si el jugador aparece por id en jugador1/jugador2
              const j1 = p.jugador1Id || (Array.isArray(p.jugador1) && p.jugador1[0]?.id) || null;
              const j2 = p.jugador2Id || (Array.isArray(p.jugador2) && p.jugador2[0]?.id) || null;
              return String(j1) === String(playerId) || String(j2) === String(playerId);
            })
            .map(p => `${etapa.id}-${grupo.id}-${p.id}`);
          for (const np of newPids) {
            if (!pidList.includes(np)) pidList.push(np);
          }
        }
      }

      // Log para diagnóstico
      console.log(`Actualizando federado ${fed.id} partidos: agregando ${pidList.length} entradas (player ${playerId})`);

      await this.federadoRepository.updatePartial(fed.id, { federadoPartidosIDs: pidList }).catch((err) => {
        console.warn(`No se pudo actualizar federadoPartidosIDs para ${fed.id}:`, err?.message || err);
      });

      // Nota: si en el futuro hay que agregar también referencias a federadoCampeonatosIDs
      // podríamos hacerlo aquí cuando se tenga el `campeonato` y el formato del ID a añadir.
    } catch (e) {
      console.warn('Error actualizando federadoPartidosIDs:', e?.message || e);
    }
  }

  /**
   * Verifica y procesa un partido con "bye" (un solo jugador)
   */
  async _checkAndProcessBye(partidoId, ronda, partidoStructure, etapa) {
    try {
      const fresh = await this._internalPartidoRepo.getById(partidoId).catch(() => null);
      if (!fresh) return null;

      const has1 = Boolean(fresh.jugador1Id || (Array.isArray(fresh.jugador1) && fresh.jugador1.length));
      const has2 = Boolean(fresh.jugador2Id || (Array.isArray(fresh.jugador2) && fresh.jugador2.length));

      // Ambos jugadores presentes: partido normal
      if (has1 && has2) return null;

      // Ningún jugador: cancelar partido
      if (!has1 && !has2) {
        fresh.estado = 'cancelado';
        await this._internalPartidoRepo.update(partidoId, fresh).catch(() => {});
        partidoStructure.estado = 'cancelado';
        return null;
      }

      // Un solo jugador: auto-ganador (bye)
      const winnerId = has1 
        ? (fresh.jugador1Id || (Array.isArray(fresh.jugador1) && fresh.jugador1[0]?.id))
        : (fresh.jugador2Id || (Array.isArray(fresh.jugador2) && fresh.jugador2[0]?.id));

      if (!winnerId) return null;

      fresh.estado = 'finalizado';
      fresh.ganadores = [String(winnerId)];
      fresh.resultado = { walkover: true, razon: 'Avance automático por bye' };
      await this._internalPartidoRepo.update(partidoId, fresh).catch(() => {});

      partidoStructure.estado = 'finalizado';
      partidoStructure.ganadorId = String(winnerId);
      partidoStructure.ganadores = [String(winnerId)];

      console.log(`Partido ${partidoId} finalizado automáticamente (bye). Ganador: ${winnerId}`);

      return {
        partidoId,
        ganador: String(winnerId),
        rondaId: ronda.id,
        rawId: String(partidoStructure.id)
      };
    } catch (e) {
      console.warn('Error procesando bye:', e?.message || e);
      return null;
    }
  }

  /**
   * Maneja la lógica de un partido de Eliminación
   */
  async _handleEliminationMatch(updated, etapa, campeonato) {
  console.log(`Procesando partido Eliminación en ronda ${updated.meta.rondaID}`);
  const etapaId = etapa.id;

  // 1) Actualizar la estructura de la etapa con TODOS los campos del partido
  try {
    const ronda = (etapa.rondas || []).find(r => String(r.id) === String(updated.meta.rondaID));
    if (ronda && Array.isArray(ronda.partidos)) {
      const partidoInRonda = ronda.partidos.find(p => {
        const rawFromUpdated = String(updated.id || '').replace(`${etapaId}-${ronda.id}-`, '');
        if (String(p.id) === String(updated.id)) return true;
        if (String(p.id) === rawFromUpdated) return true;
        if (String(updated.id).endsWith(`-${p.id}`)) return true;
        return false;
      });

      if (partidoInRonda) {
        // ✅ SINCRONIZAR TODOS LOS CAMPOS
        partidoInRonda.estado = updated.estado || partidoInRonda.estado;
        
        // Sincronizar jugadores completos
        if (Array.isArray(updated.jugador1) && updated.jugador1.length) {
          partidoInRonda.jugador1 = updated.jugador1.map(j => ({
            id: j.id,
            nombre: j.nombre,
            club: j.club
          }));
        }
        if (Array.isArray(updated.jugador2) && updated.jugador2.length) {
          partidoInRonda.jugador2 = updated.jugador2.map(j => ({
            id: j.id,
            nombre: j.nombre,
            club: j.club
          }));
        }
        if (updated.jugador1Id) partidoInRonda.jugador1Id = updated.jugador1Id;
        if (updated.jugador2Id) partidoInRonda.jugador2Id = updated.jugador2Id;
        
        // Sincronizar resultado COMPLETO
        if (updated.resultado) {
          partidoInRonda.resultado = JSON.parse(JSON.stringify(updated.resultado)); // deep copy
        }
        
        // Sincronizar sets
        if (updated.resultado && Array.isArray(updated.resultado.sets)) {
          partidoInRonda.sets = JSON.parse(JSON.stringify(updated.resultado.sets));
        }
        
        // Sincronizar ganadores
        partidoInRonda.ganadores = Array.isArray(updated.ganadores) 
          ? updated.ganadores.map(g => String(g))
          : (updated.ganadores ? [String(updated.ganadores)] : []);
        
        if (partidoInRonda.ganadores.length >= 1) {
          partidoInRonda.ganadorId = String(partidoInRonda.ganadores[0]);
        }
        
        // Sincronizar fechas
        if (updated.fechaProgramada) {
          partidoInRonda.fechaProgramada = updated.fechaProgramada;
        }
        if (updated.fechaJugado) {
          partidoInRonda.fechaJugado = updated.fechaJugado;
        } else if (updated.estado === 'finalizado' && !partidoInRonda.fechaJugado) {
          partidoInRonda.fechaJugado = new Date().toISOString();
        }

        console.log(`✓ Partido sincronizado en estructura de etapa`);
      }
    }
  } catch (e) {
    console.warn('Error actualizando estructura de etapa:', e?.message || e);
  }

  // Guardar etapa actualizada ANTES de propagar
  await this.etapaRepository.save({ id: etapa.id, ...etapa }).catch((e) => {
    console.warn('No se pudo persistir etapa:', e?.message || e);
  });

  // 2) Propagar ganador a siguiente ronda
  await this._propagateToNextRound(etapa, updated, campeonato);

  // 3) Verificar si todas las rondas están completas
  const todasRondasCompletas = this._areAllRoundsComplete(etapa);
  console.log(`¿Todas las rondas completas? ${todasRondasCompletas ? 'SÍ ✓' : 'NO ✗'}`);
  
  if (todasRondasCompletas) {
    console.log('🎯 Todas las rondas completadas. Verificando siguiente etapa...');
    await this._checkAndPromoteToNextStage(etapa, campeonato);
  }
}

  /**
   * Propaga el ganador de un partido a la siguiente ronda
   */
  /**
 * Propaga el ganador de un partido a la siguiente ronda
 * Corrige la lógica para manejar correctamente el avance por índices de bracket
 */
/**
 * MÉTODO COMPLETO CORREGIDO: _propagateToNextRound
 * Ahora sincroniza TAMBIÉN en la estructura de la etapa
 */
async _propagateToNextRound(etapa, updated, campeonato) {
  try {
    console.log(`\n--- Propagando ganador de partido ${updated.id} ---`);
    
    // 1. Identificar ronda actual
    const currentRondaId = updated.meta.rondaID;
    const currentRonda = (etapa.rondas || []).find(r => String(r.id) === String(currentRondaId));
    
    if (!currentRonda) {
      console.warn('No se encontró la ronda actual');
      return;
    }

    console.log(`Ronda actual: ${currentRonda.nombre} (índice ${currentRonda.indice})`);

    // 2. Identificar siguiente ronda
    const nextRonda = (etapa.rondas || []).find(r => r.indice === currentRonda.indice + 1);
    
    if (!nextRonda) {
      console.log('✓ No hay siguiente ronda. Este partido es la FINAL.');
      return;
    }

    console.log(`Siguiente ronda: ${nextRonda.nombre} (índice ${nextRonda.indice})`);

    // 3. Encontrar índice del partido actual
    const currentPartidoIndex = currentRonda.partidos.findIndex(p => {
      const rawFromUpdated = String(updated.id || '').replace(`${etapa.id}-${currentRonda.id}-`, '');
      if (String(p.id) === String(updated.id)) return true;
      if (String(p.id) === rawFromUpdated) return true;
      if (String(updated.id).endsWith(`-${p.id}`)) return true;
      return false;
    });

    if (currentPartidoIndex === -1) {
      console.warn('No se encontró el partido en la estructura');
      return;
    }

    console.log(`Partido actual: índice ${currentPartidoIndex}`);

    // 4. Calcular destino (partidos [0,1] → siguiente[0], [2,3] → siguiente[1], etc.)
    const targetPartidoIndex = Math.floor(currentPartidoIndex / 2);
    const isJugador1 = (currentPartidoIndex % 2) === 0;

    console.log(`Destino: partido ${targetPartidoIndex}, ${isJugador1 ? 'jugador1' : 'jugador2'}`);

    // 5. Obtener partido de destino EN LA ESTRUCTURA
    const targetPartido = nextRonda.partidos[targetPartidoIndex];
    if (!targetPartido) {
      console.warn(`No existe partido destino en índice ${targetPartidoIndex}`);
      return;
    }

    // 6. Construir ID completo
    const targetPartidoId = String(targetPartido.id).startsWith(`${etapa.id}-${nextRonda.id}-`) 
      ? targetPartido.id 
      : `${etapa.id}-${nextRonda.id}-${targetPartido.id}`;

    console.log(`Partido destino: ${targetPartidoId}`);

    // 7. Cargar partido persistido
    const partidoToUpdate = await this._internalPartidoRepo.getById(targetPartidoId).catch(() => null);
    if (!partidoToUpdate) {
      console.warn(`No se pudo cargar partido ${targetPartidoId}`);
      return;
    }

    // 8. Determinar modo (singles/dobles)
    const ganadores = updated.ganadores || [];
    const isDobles = Array.isArray(ganadores) && ganadores.length > 1;

    console.log(`Modo: ${isDobles ? 'DOBLES' : 'SINGLES'}, Ganadores: ${ganadores.join(', ')}`);

    // 9. Obtener datos completos de ganadores
    let ganadoresData = [];
    for (const gId of ganadores) {
      const gData = await this._getFederadoData(gId, campeonato);
      const gName = gData.nombre || await this._getFederadoName(gId);
      ganadoresData.push({ 
        id: gData.id,
        nombre: gName,
        club: gData.club 
      });
    }

    // 10. Asignar en PARTIDO PERSISTIDO
    if (isJugador1) {
      if (isDobles) {
        partidoToUpdate.jugador1 = ganadoresData;
        partidoToUpdate.equipoLocal = ganadores.map(g => String(g));
      } else {
        const winnerId = ganadores[0];
        partidoToUpdate.jugador1Id = winnerId;
        partidoToUpdate.jugador1 = ganadoresData[0];
        partidoToUpdate.jugador1Nombre = ganadoresData[0].nombre;
      }
      console.log(`  ✓ Asignado a jugador1 en partido persistido`);
    } else {
      if (isDobles) {
        partidoToUpdate.jugador2 = ganadoresData;
        partidoToUpdate.equipoVisitante = ganadores.map(g => String(g));
      } else {
        const winnerId = ganadores[0];
        partidoToUpdate.jugador2Id = winnerId;
        partidoToUpdate.jugador2 = ganadoresData[0];
        partidoToUpdate.jugador2Nombre = ganadoresData[0].nombre;
      }
      console.log(`  ✓ Asignado a jugador2 en partido persistido`);
    }

    // 11. ✅ CRÍTICO: Asignar TAMBIÉN en ESTRUCTURA DE ETAPA
    if (isJugador1) {
      if (isDobles) {
        targetPartido.jugador1 = ganadoresData.map(g => ({
          id: g.id,
          nombre: g.nombre,
          club: g.club
        }));
      } else {
        const winnerId = ganadores[0];
        targetPartido.jugador1Id = winnerId;
        targetPartido.jugador1 = [{
          id: ganadoresData[0].id,
          nombre: ganadoresData[0].nombre,
          club: ganadoresData[0].club
        }];
      }
      console.log(`  ✓ Asignado a jugador1 en estructura de etapa`);
    } else {
      if (isDobles) {
        targetPartido.jugador2 = ganadoresData.map(g => ({
          id: g.id,
          nombre: g.nombre,
          club: g.club
        }));
      } else {
        const winnerId = ganadores[0];
        targetPartido.jugador2Id = winnerId;
        targetPartido.jugador2 = [{
          id: ganadoresData[0].id,
          nombre: ganadoresData[0].nombre,
          club: ganadoresData[0].club
        }];
      }
      console.log(`  ✓ Asignado a jugador2 en estructura de etapa`);
    }

    // 12. Resetear estado del partido destino (ambos lados)
    partidoToUpdate.estado = 'pendiente';
    delete partidoToUpdate.ganadores;
    delete partidoToUpdate.ganadorId;
    delete partidoToUpdate.resultado;
    
    targetPartido.estado = 'pendiente';
    delete targetPartido.ganadores;
    delete targetPartido.ganadorId;
    delete targetPartido.resultado;
    delete targetPartido.sets;

    // 13. Persistir partido actualizado
    await this._internalPartidoRepo.update(targetPartidoId, partidoToUpdate).catch((err) => {
      console.warn(`Error persistiendo: ${err?.message || err}`);
    });

    // 14. ✅ GUARDAR ETAPA ACTUALIZADA CON JUGADORES ASIGNADOS
    await this.etapaRepository.save({ id: etapa.id, ...etapa }).catch((e) => {
      console.warn('No se pudo persistir etapa tras asignar jugadores:', e?.message || e);
    });

    // 15. Actualizar federadoPartidosIDs para cada ganador
    for (const gId of ganadores) {
      await this._addPartidoToFederado(gId, targetPartidoId);
    }

    console.log('--- Propagación completada ---\n');

  } catch (e) {
    console.error('Error en _propagateToNextRound:', e?.message || e);
    console.error(e);
  }
}

/**
 * NUEVO MÉTODO: Añade un partido específico al federado
 */
async _addPartidoToFederado(federadoId, partidoId) {
  try {
    const fed = await this.federadoRepository.getFederadoById(federadoId).catch(() => null);
    if (!fed) {
      console.warn(`Federado ${federadoId} no encontrado`);
      return;
    }

    if (!Array.isArray(fed.federadoPartidosIDs)) {
      fed.federadoPartidosIDs = [];
    }

    const partidoIdStr = String(partidoId);
    if (!fed.federadoPartidosIDs.includes(partidoIdStr)) {
      fed.federadoPartidosIDs.push(partidoIdStr);
      
      await this.federadoRepository.updatePartial(fed.id, { 
        federadoPartidosIDs: fed.federadoPartidosIDs 
      });
      
      console.log(`  ✓ Partido ${partidoId} añadido a federado ${federadoId}`);
    } else {
      console.log(`  ℹ Partido ${partidoId} ya existe en federado ${federadoId}`);
    }
  } catch (e) {
    console.warn(`Error añadiendo partido a federado ${federadoId}:`, e?.message || e);
  }
}

  /**
   * Propagación alternativa por índice de bracket
   */
  async _propagateByBracketIndex(etapa, updated, rawPartidoId, campeonato) {
    try {
      const m = String(rawPartidoId).match(/-(\d+)$/);
      if (!m) return;

      const idx = parseInt(m[1], 10);
      const currentRondaMatch = String(rawPartidoId).match(/r(\d+)-/);
      if (!currentRondaMatch) return;

      const currentRondaIndice = parseInt(currentRondaMatch[1], 10);
      const nextRonda = (etapa.rondas || []).find(r => r.indice === (currentRondaIndice + 1));
      
      if (!nextRonda || !Array.isArray(nextRonda.partidos)) return;

      const targetIdx = Math.floor(idx / 2);
      const targetPart = nextRonda.partidos[targetIdx];
      if (!targetPart) return;

      const targetPartidoId = `${etapa.id}-${nextRonda.id}-${targetPart.id}`;
      const partidoToUpdate = await this._internalPartidoRepo.getById(targetPartidoId).catch(() => null);
      if (!partidoToUpdate) return;

      const isEven = idx % 2 === 0;
      
      if (isEven) {
        if (Array.isArray(updated.ganadores) && updated.ganadores.length > 1) {
          // Dobles
          const ganadoresData = [];
          for (const gId of updated.ganadores) {
            const gData = await this._getFederadoData(gId, campeonato);
            const gName = gData.nombre || await this._getFederadoName(gId);
            ganadoresData.push({ ...gData, nombre: gName });
          }
          partidoToUpdate.jugador1 = ganadoresData;
          partidoToUpdate.equipoLocal = updated.ganadores.map(g => String(g));
        } else {
          // Singles
          const winnerId = updated.ganadores[0];
          const winnerData = await this._getFederadoData(winnerId, campeonato);
          const winnerName = winnerData.nombre || await this._getFederadoName(winnerId);
          partidoToUpdate.jugador1Id = winnerId;
          partidoToUpdate.jugador1 = { ...winnerData, nombre: winnerName };
          partidoToUpdate.jugador1Nombre = winnerName;
        }
        targetPart.jugador1Id = partidoToUpdate.jugador1Id || null;
        targetPart.jugador1 = partidoToUpdate.jugador1 || null;
        console.log(`  ↳ Propagado por bracket a ${targetPartidoId} (jugador1)`);
      } else {
        if (Array.isArray(updated.ganadores) && updated.ganadores.length > 1) {
          // Dobles
          const ganadoresData = [];
          for (const gId of updated.ganadores) {
            const gData = await this._getFederadoData(gId, campeonato);
            const gName = gData.nombre || await this._getFederadoName(gId);
            ganadoresData.push({ ...gData, nombre: gName });
          }
          partidoToUpdate.jugador2 = ganadoresData;
          partidoToUpdate.equipoVisitante = updated.ganadores.map(g => String(g));
        } else {
          // Singles
          const winnerId = updated.ganadores[0];
          const winnerData = await this._getFederadoData(winnerId, campeonato);
          const winnerName = winnerData.nombre || await this._getFederadoName(winnerId);
          partidoToUpdate.jugador2Id = winnerId;
          partidoToUpdate.jugador2 = { id: winnerId, nombre: winnerName };
          partidoToUpdate.jugador2Nombre = winnerName;
        }
        targetPart.jugador2Id = partidoToUpdate.jugador2Id || null;
        targetPart.jugador2 = partidoToUpdate.jugador2 || null;
        console.log(`  ↳ Propagado por bracket a ${targetPartidoId} (jugador2)`);
      }

      await this._internalPartidoRepo.update(targetPartidoId, partidoToUpdate).catch(() => {});

      // Añadir a federadoPartidosIDs
      for (const g of updated.ganadores || []) {
        await this._addMatchesToFederado(etapa, { partidos: [targetPart] }, g, nextRonda);
      }

      // Verificar bye
      const byeResult = await this._checkAndProcessBye(targetPartidoId, nextRonda, targetPart, etapa);
      if (byeResult) {
        await this._propagateEliminationWinner(byeResult, etapa, campeonato);
      }
    } catch (e) {
      console.warn('Error en propagación por bracket index:', e?.message || e);
    }
  }

  /**
   * Propaga un ganador automático (bye) en eliminación
   */
  async _propagateEliminationWinner(autoFinalized, etapa, campeonato) {
    try {
      const rawPartidoId = autoFinalized.rawId;
      const targetOrigen = `ganador-${rawPartidoId}`;
      const winnerId = autoFinalized.ganador;
      const winnerName = await this._getFederadoName(winnerId);

      for (const ronda of etapa.rondas || []) {
        for (const rp of ronda.partidos || []) {
          const p1Origen = rp.jugador1Origen || (rp.meta?.jugador1Origen) || (rp.meta?.team1Origen);
          const p2Origen = rp.jugador2Origen || (rp.meta?.jugador2Origen) || (rp.meta?.team2Origen);

          if (p1Origen === targetOrigen || p2Origen === targetOrigen) {
            const targetPartidoId = `${etapa.id}-${ronda.id}-${rp.id}`;
            const partidoToUpdate = await this._internalPartidoRepo.getById(targetPartidoId).catch(() => null);
            if (!partidoToUpdate) continue;

            if (p1Origen === targetOrigen) {
              partidoToUpdate.jugador1Id = winnerId;
              partidoToUpdate.jugador1 = { id: winnerId, nombre: winnerName };
              partidoToUpdate.jugador1Nombre = winnerName;
              rp.jugador1Id = winnerId;
              rp.jugador1 = { id: winnerId, nombre: winnerName };
            }
            if (p2Origen === targetOrigen) {
              partidoToUpdate.jugador2Id = winnerId;
              partidoToUpdate.jugador2 = { id: winnerId, nombre: winnerName };
              partidoToUpdate.jugador2Nombre = winnerName;
              rp.jugador2Id = winnerId;
              rp.jugador2 = { id: winnerId, nombre: winnerName };
            }

            await this._internalPartidoRepo.update(targetPartidoId, partidoToUpdate).catch(() => {});

            // Verificar nuevo bye y propagar recursivamente
            const newBye = await this._checkAndProcessBye(targetPartidoId, ronda, rp, etapa);
            if (newBye) {
              await this._propagateEliminationWinner(newBye, etapa, campeonato);
            }
          }
        }
      }

      // Actualizar federadoPartidosIDs
      try {
        const fed = await this.federadoRepository.getFederadoById(winnerId).catch(() => null);
        if (fed) {
          const pidList = Array.isArray(fed.federadoPartidosIDs) ? fed.federadoPartidosIDs : [];
          for (const r of etapa.rondas || []) {
            for (const rp of r.partidos || []) {
              const pid = `${etapa.id}-${r.id}-${rp.id}`;
              if (!pidList.includes(pid) && (rp.jugador1Id === winnerId || rp.jugador2Id === winnerId)) {
                pidList.push(pid);
              }
            }
          }
          await this.federadoRepository.updatePartial(fed.id, { federadoPartidosIDs: pidList }).catch(() => {});
        }
      } catch (e) {
        console.warn('Error actualizando federadoPartidosIDs:', e?.message || e);
      }
    } catch (e) {
      console.warn('Error propagando ganador automático:', e?.message || e);
    }
  }

  /**
   * Verifica si todas las rondas de eliminación están completas
   */
  _areAllRoundsComplete(etapa) {
    if (!etapa.rondas || etapa.rondas.length === 0) return false;

    return etapa.rondas.every((ronda, idx) => {
      const completa = (ronda.partidos || []).every(p => {
        // Partido finalizado
        if (p.estado === 'finalizado' || p.estado === 'cancelado') return true;

        // Verificar si tiene ambos jugadores
        const has1 = Boolean(p.jugador1Id || (Array.isArray(p.jugador1) && p.jugador1.length));
        const has2 = Boolean(p.jugador2Id || (Array.isArray(p.jugador2) && p.jugador2.length));

        // Si no tiene ningún jugador, está cancelado/completo
        // Si tiene solo uno, debería haberse auto-completado
        // Si tiene ambos, está pendiente
        return !has1 || !has2;
      });
      
      console.log(`  - Ronda ${idx} (${ronda.nombre}): ${completa ? 'COMPLETA ✓' : 'PENDIENTE ⏳'}`);
      return completa;
    });
  }

  /**
   * Verifica y promueve jugadores a la siguiente etapa tras completar eliminación
   */
  async _checkAndPromoteToNextStage(etapa, campeonato) {
    console.log('\n========== PROMOCIÓN DESDE ELIMINACIÓN ==========');
    if (!campeonato || !Array.isArray(campeonato.etapasIDs)) {
      console.warn('No hay campeonato o etapas definidas');
      return;
    }

    const etapaIndex = campeonato.etapasIDs.indexOf(etapa.id);
    const nextEtapaId = campeonato.etapasIDs[etapaIndex + 1];
    
    if (!nextEtapaId) {
      console.log('✓ No hay siguiente etapa. Campeonato finalizado.');
      return;
    }

    const nextEtapa = await this.etapaRepository.findById(nextEtapaId).catch(() => null);
    if (!nextEtapa) {
      console.warn('No se pudo cargar la siguiente etapa');
      return;
    }

    console.log(`Siguiente etapa: ${nextEtapa.nombre} (${nextEtapa.tipoEtapa})`);

    // Obtener ganadores de la última ronda (los clasificados)
    const lastRonda = etapa.rondas[etapa.rondas.length - 1];
    if (!lastRonda) {
      console.warn('No hay última ronda');
      return;
    }

    const advancing = [];
    for (const p of lastRonda.partidos || []) {
      if (p.estado === 'finalizado' && p.ganadorId) {
        advancing.push(p.ganadorId);
      } else if (p.ganadores && p.ganadores.length) {
        advancing.push(...p.ganadores);
      }
    }

    // Filtrar duplicados
    const uniqueAdvancing = Array.from(new Set(advancing.map(String)));

    console.log(`Total de ganadores: ${uniqueAdvancing.length}`);
    console.log(`Jugadores: ${uniqueAdvancing.join(', ')}`);

    if (uniqueAdvancing.length === 0) {
      console.warn('⚠️ No hay ganadores para promover');
      return;
    }

    // Asignar en la siguiente etapa
    if (nextEtapa.tipoEtapa === 'roundRobin') {
      console.log('Asignando a siguiente etapa Round Robin...');
      await this._assignToRoundRobin(nextEtapa, uniqueAdvancing, campeonato);
    } else if (nextEtapa.tipoEtapa === 'eliminacion') {
      console.log('Asignando a siguiente etapa Eliminación...');
      await this._assignToElimination(nextEtapa, uniqueAdvancing, campeonato);
    }

    console.log('========== FIN PROMOCIÓN ==========\n');
  }
}