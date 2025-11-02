import { applyOnCreate, applyOnEdit } from "../../services/Rankings/RankingsFromPartido.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";

export class SetGanadoresPartido {
  constructor(partidoRepo) {
    this.partidoRepo = partidoRepo;
    this.etapaRepository = new EtapaRepository();
    this.campeonatoRepository = new CampeonatoRepository();
    // partidoRepo may be provided from controller, but ensure we have an instance for internal updates
    this._internalPartidoRepo = this.partidoRepo || new PartidoRepository();
  }

  async execute(partidoId, ganadores = [], resultado = null, puntosGanador, puntosPerdedor) {
    const oldPartido = await this.partidoRepo.getById(partidoId);
    if (!oldPartido) throw new Error("Partido no encontrado");

    const uniq = (arr = []) => Array.from(new Set((arr || []).map((v) => String(v).trim())));

    const updated = {
      ...oldPartido,
      ganadores: uniq(ganadores),
      resultado: resultado ?? oldPartido.resultado,
      estado: "finalizado",
    };

    // Persist partido finalizado
    await this.partidoRepo.update(partidoId, updated);

    // Actualizar rankings / puntos de temporada (si aplica)
    try {
      await applyOnEdit(oldPartido, updated, puntosGanador, puntosPerdedor);
    } catch (e) {
      // No bloquear por errores en rankings
      console.warn('Error aplicando rankings desde SetGanadoresPartido:', e?.message || e);
    }

    // Actualizar etapa asociada (estadísticas de grupo / avance en rondas)
    try {
      if (updated.etapa) {
        const etapa = await this.etapaRepository.findById(updated.etapa);
        if (etapa) {
          // Obtener campeonato si se necesita para puntos locales
          const campeonato = etapa.campeonatoID ? await this.campeonatoRepository.findById(etapa.campeonatoID) : null;
          const puntosPorPosicion = campeonato?.puntosPorPosicion ?? 3;

          // ROUND ROBIN: actualizar partido dentro del grupo y estadísticas de los slots
          if (etapa.tipoEtapa === 'roundRobin' && updated.meta && updated.meta.grupoID) {
            const grupo = (etapa.grupos || []).find(g => g.id === updated.meta.grupoID);
            if (grupo) {
              // Actualizar partido en la estructura de la etapa (buscar partido por id raw)
              const partidoInGrupo = (grupo.partidos || []).find(p => (
                (typeof p.jugador1Index !== 'undefined' && typeof p.jugador2Index !== 'undefined' && (
                  (p.jugador1Index === updated.meta?.jugador1Index && p.jugador2Index === updated.meta?.jugador2Index) ||
                  (p.jugador1Index === updated.meta?.jugador2Index && p.jugador2Index === updated.meta?.jugador1Index)
                )) || p.id === (updated.id.replace(`${etapa.id}-${grupo.id}-`, ''))
              ));

              if (partidoInGrupo) {
                // actualizar campos visibles
                if (Array.isArray(updated.jugador1) && updated.jugador1.length > 0) partidoInGrupo.jugador1 = updated.jugador1;
                if (Array.isArray(updated.jugador2) && updated.jugador2.length > 0) partidoInGrupo.jugador2 = updated.jugador2;
                if (updated.jugador1Id) partidoInGrupo.jugador1Id = updated.jugador1Id;
                if (updated.jugador2Id) partidoInGrupo.jugador2Id = updated.jugador2Id;
                partidoInGrupo.estado = updated.estado;
                partidoInGrupo.resultado = updated.resultado;

                // Actualizar estadísticas de grupo según ganadores
                const winners = updated.ganadores || [];
                const idx1 = partidoInGrupo.jugador1Index;
                const idx2 = partidoInGrupo.jugador2Index;
                if (typeof idx1 !== 'undefined' && typeof idx2 !== 'undefined') {
                  const slot1 = grupo.jugadores[idx1];
                  const slot2 = grupo.jugadores[idx2];
                  // determinar quién ganó comparando ids
                  let ganadorLado = null; // 1 or 2
                  if (Array.isArray(updated.jugador1) && updated.jugador1.length) {
                    const j1ids = updated.jugador1.map(x => String(x?.id));
                    if (winners.some(w => j1ids.includes(String(w)))) ganadorLado = 1;
                  }
                  if (Array.isArray(updated.jugador2) && updated.jugador2.length) {
                    const j2ids = updated.jugador2.map(x => String(x?.id));
                    if (winners.some(w => j2ids.includes(String(w)))) ganadorLado = 2;
                  }
                  // singles
                  if (!Array.isArray(slot1) && !Array.isArray(slot2) ) {
                    // legacy single slots: slot has .id
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
                    // equipos / dobles
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
                }
              }
            }

            // Persistir etapa actualizada
            await this.etapaRepository.save({ id: etapa.id, ...etapa });
          }

          // ELIMINACION: propagar ganador a siguiente partido con origen 'ganador-...'
          if (etapa.tipoEtapa === 'eliminacion' && updated.meta && updated.meta.rondaID) {
            const etapaId = etapa.id;
            const rawPartidoId = updated.id.replace(`${etapaId}-${updated.meta.rondaID}-`, '');

            // Buscar rondas que contengan partidos con origen apuntando al ganador de este partido
            for (const ronda of etapa.rondas || []) {
              for (const p of ronda.partidos || []) {
                const pJugador1Origen = p.jugador1Origen || (p.meta && p.meta.jugador1Origen) || (p.meta && p.meta.team1Origen);
                const pJugador2Origen = p.jugador2Origen || (p.meta && p.meta.jugador2Origen) || (p.meta && p.meta.team2Origin);

                const targetOrigen = `ganador-${rawPartidoId}`;

                if (pJugador1Origen === targetOrigen) {
                  // asignar ganador al lado 1
                  const targetPartidoId = `${etapaId}-${ronda.id}-${p.id}`;
                  const partidoToUpdate = await this._internalPartidoRepo.getById(targetPartidoId).catch(() => null);
                  if (partidoToUpdate) {
                    if (Array.isArray(updated.ganadores) && updated.ganadores.length > 1) {
                      // dobles: assign array of players
                      partidoToUpdate.jugador1 = updated.ganadores.map(g => ({ id: g }));
                      partidoToUpdate.equipoLocal = updated.ganadores.map(g => String(g));
                    } else {
                      partidoToUpdate.jugador1Id = updated.ganadores[0] || null;
                      partidoToUpdate.jugador1Nombre = null;
                    }
                    await this._internalPartidoRepo.update(targetPartidoId, partidoToUpdate).catch(() => {});
                    // also update etapa structure
                    p.jugador1Id = partidoToUpdate.jugador1Id || null;
                    p.jugador1 = partidoToUpdate.jugador1 || null;
                  }
                }

                if (pJugador2Origen === targetOrigen) {
                  const targetPartidoId = `${etapaId}-${ronda.id}-${p.id}`;
                  const partidoToUpdate = await this._internalPartidoRepo.getById(targetPartidoId).catch(() => null);
                  if (partidoToUpdate) {
                    if (Array.isArray(updated.ganadores) && updated.ganadores.length > 1) {
                      partidoToUpdate.jugador2 = updated.ganadores.map(g => ({ id: g }));
                      partidoToUpdate.equipoVisitante = updated.ganadores.map(g => String(g));
                    } else {
                      partidoToUpdate.jugador2Id = updated.ganadores[0] || null;
                      partidoToUpdate.jugador2Nombre = null;
                    }
                    await this._internalPartidoRepo.update(targetPartidoId, partidoToUpdate).catch(() => {});
                    p.jugador2Id = partidoToUpdate.jugador2Id || null;
                    p.jugador2 = partidoToUpdate.jugador2 || null;
                  }
                }
              }
            }

            // Persistir etapa con avances
            await this.etapaRepository.save({ id: etapa.id, ...etapa });
          }
        }
      }
    } catch (e) {
      // No bloquear por errores en actualización de etapas
      console.warn('Error actualizando etapa desde SetGanadoresPartido:', e?.message || e);
    }

    return updated;
  }
}
