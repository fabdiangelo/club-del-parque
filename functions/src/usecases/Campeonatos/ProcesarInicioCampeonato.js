import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";

class ProcesarInicioCampeonato {
  constructor(){
    this.campeonatoRepository = new CampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
    this.partidoRepository = new PartidoRepository();
  }

  /**
   * Procesa ajustes al iniciar un campeonato: expirar invitaciones >1 semana,
   * combinar grupos completamente vacíos, intentar emparejar equipos de 1 jugador,
   * y descalificar equipos solitarios eliminando sus partidos posteriores.
   */
  async execute(campeonatoId){
    if(!campeonatoId) throw new Error('Se requiere campeonatoId');
    const campeonato = await this.campeonatoRepository.findById(campeonatoId);
    if(!campeonato) throw new Error('Campeonato no encontrado');

    if(!Array.isArray(campeonato.etapasIDs)) return true;

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    for(const etapaId of campeonato.etapasIDs){
      const etapa = await this.etapaRepository.findById(etapaId);
      if(!etapa) continue;

      if(etapa.tipoEtapa === 'roundRobin' && Array.isArray(etapa.grupos)){
        // Expirar invitaciones y collect groups
        const grupos = etapa.grupos;
        const emptyGroupIndexes = [];
        const singles = []; // { grupoIdx, slotIdx }

        for(let gi=0; gi<grupos.length; gi++){
          const grupo = grupos[gi];
          if(!Array.isArray(grupo.jugadores)) continue;
          let allEmpty = true;
          for(let si=0; si<grupo.jugadores.length; si++){
            const slot = grupo.jugadores[si];
            if(!slot) continue;
            // expire invitation if older than a week
            if(slot.invitation && slot.invitation.fechaEnvio){
              const envio = new Date(slot.invitation.fechaEnvio).getTime();
              if((now - envio) > oneWeekMs && slot.invitation.estado === 'pendiente'){
                slot.invitation.estado = 'expirada';
              }
            }

            const hasPlayer = Array.isArray(slot.players) ? slot.players.some(p => p && p.id) : !!slot.id;
            if(hasPlayer) allEmpty = false;

            // collect singles (only one player) for potential pairing
            if(Array.isArray(slot.players)){
              const filled = slot.players.filter(p => p && p.id).length;
              if(filled === 1) singles.push({ grupoIdx: gi, slotIdx: si });
            }
          }
          if(allEmpty) emptyGroupIndexes.push(gi);
        }

        // Combine empty groups pairwise: move slots from later empty to first empty
        while(emptyGroupIndexes.length >= 2){
          const target = emptyGroupIndexes.shift();
          const source = emptyGroupIndexes.shift();
          // move all slots from source to target
          const sourceGroup = grupos[source];
          const targetGroup = grupos[target];
          targetGroup.jugadores = targetGroup.jugadores.concat(sourceGroup.jugadores || []);
          // remove source group
          grupos.splice(source,1);
          // recompute emptyGroupIndexes
          // simple approach: recompute from scratch
          emptyGroupIndexes.length = 0;
          for(let gi=0; gi<grupos.length; gi++){
            const g = grupos[gi];
            const allEmpty = !g.jugadores || g.jugadores.every(s => {
              if(!s) return true;
              if(Array.isArray(s.players)) return !s.players.some(p => p && p.id);
              return !s.id;
            });
            if(allEmpty) emptyGroupIndexes.push(gi);
          }
        }

        // Try to pair singles: naive greedy pair within etapa
        while(singles.length >= 2){
          const a = singles.shift();
          // find partner not same slot
          let partnerIdx = -1;
          for(let i=0;i<singles.length;i++){
            if(!(singles[i].grupoIdx === a.grupoIdx && singles[i].slotIdx === a.slotIdx)){
              partnerIdx = i; break;
            }
          }
          if(partnerIdx === -1) break;
          const b = singles.splice(partnerIdx,1)[0];
          // pair player from slot b into slot a (fill empty position)
          const slotA = grupos[a.grupoIdx].jugadores[a.slotIdx];
          const slotB = grupos[b.grupoIdx].jugadores[b.slotIdx];
          // move the single player from B to A's empty position
          const playerFromB = slotB.players.find(p => p && p.id);
          const emptyIndexA = slotA.players.findIndex(p => !p || !p.id);
          if(playerFromB && emptyIndexA !== -1){
            slotA.players[emptyIndexA] = playerFromB;
            // clear slotB
            slotB.players = slotB.players.map(_ => ({ id: null, nombre: null }));
          }
        }

        // Any remaining singles (unpaired) -> descalificar and remove their partidos
        for(const s of singles){
          const slot = grupos[s.grupoIdx].jugadores[s.slotIdx];
          // mark descalificado
          slot.descalificado = true;
          // remove partidos referencing this slot
          if(Array.isArray(grupos[s.grupoIdx].partidos)){
            for(const partido of grupos[s.grupoIdx].partidos){
              if(partido.jugador1Index === s.slotIdx || partido.jugador2Index === s.slotIdx){
                const partidoId = `${etapa.id}-${grupos[s.grupoIdx].id || 'grupo'}-${partido.id}`;
                try { await this.partidoRepository.delete(partidoId); } catch(e){}
                // also remove from array
                const idx = grupos[s.grupoIdx].partidos.indexOf(partido);
                if(idx !== -1) grupos[s.grupoIdx].partidos.splice(idx,1);
              }
            }
          }
        }

        // persist etapa
        await this.etapaRepository.save({ id: etapa.id, ...etapa });
      }

      // Eliminacion: for dobles, if a team is single and unpaired, descalificar and delete their partidos
      if(etapa.tipoEtapa === 'eliminacion' && Array.isArray(etapa.rondas)){
        for(const ronda of etapa.rondas){
          for(const partido of ronda.partidos){
            if(partido.equipoLocal && partido.equipoLocal.length === 1){
              // check invitation expiry if any
              // if no partner after processing, descalificar: delete their future matches
              // Here simply delete partido
              const partidoId = `${etapa.id}-${ronda.id || 'ronda'}-${partido.id}`;
              try { await this.partidoRepository.delete(partidoId); } catch(e){}
            }
            if(partido.equipoVisitante && partido.equipoVisitante.length === 1){
              const partidoId = `${etapa.id}-${ronda.id || 'ronda'}-${partido.id}`;
              try { await this.partidoRepository.delete(partidoId); } catch(e){}
            }
          }
        }
        await this.etapaRepository.save({ id: etapa.id, ...etapa });
      }
    }

    return true;
  }
}

export default new ProcesarInicioCampeonato();
