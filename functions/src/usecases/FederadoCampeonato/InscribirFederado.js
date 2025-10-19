
import FederadoCampeonato from "../../domain/entities/FederadoCampeonato.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { FederadoCampeonatoRepository } from "../../infraestructure/adapters/FederadoCampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";

class InscribirFederado {
  constructor() {
    this.campeonatoRepository = new CampeonatoRepository();
    this.federadoRepository = new FederadoRepository();
    this.federadoCampeonatoRepository = new FederadoCampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
    this.partidoRepository = new PartidoRepository();
  }

  /**
   * Inscribe un federado (uid) en un campeonato (campeonatoId).
   * Valida: licencia vigente (validoHasta > inicio), no duplicado y cupos disponibles.
   * Asocia al campeonato, crea el registro federado-campeonato y lo inserta en la primera etapa
   * (en roundRobin lo pone en un grupo/slot y actualiza los partidos correspondientes; en eliminación
   * lo asigna a los slots de la primera ronda de inscripción).
   */
  // inviteeUid (optional): when provided in a doubles championship, the registrant sends an invitation to that user
  async execute(uid, campeonatoId, inviteeUid = null) {
    if (!uid) throw new Error("Se requiere el uid del federado");
    if (!campeonatoId) throw new Error("Se requiere el id del campeonato");

    // Obtener datos
    const federado = await this.federadoRepository.getFederadoById(uid);
    if (!federado) throw new Error("Federado no encontrado");

    const campeonato = await this.campeonatoRepository.findById(campeonatoId);
    if (!campeonato) throw new Error("Campeonato no encontrado");

    // 1) Validar validoHasta > inicio
    if (!federado.validoHasta) throw new Error("Federado no tiene licencia válida");
    const validoHasta = new Date(federado.validoHasta);
    const inicio = new Date(campeonato.inicio);
    if (isNaN(validoHasta.getTime()) || isNaN(inicio.getTime())) {
      throw new Error("Formato de fecha inválido en federado o campeonato");
    }
    if (validoHasta.getTime() <= inicio.getTime()) {
      throw new Error("La licencia del federado vence antes del inicio del campeonato");
    }

    // 2) Verificar que no esté ya inscripto en el mismo campeonato
    // Buscar en la colección federado-campeonato por federadoID
    const existentes = await this.federadoCampeonatoRepository.db.getItemsByField(this.federadoCampeonatoRepository.collection, 'federadoID', uid);
    const yaInscripto = Array.isArray(existentes) ? existentes.find(x => x.campeonatoID === campeonatoId) : null;
    if (yaInscripto) throw new Error('El federado ya está inscripto en este campeonato');

    // Validar requisitosParticipacion (género, edad, ranking (comentado))
    const requisitos = campeonato.requisitosParticipacion || {};
    if (requisitos.genero && requisitos.genero !== 'ambos') {
      if (!federado.genero || federado.genero.toLowerCase() !== requisitos.genero.toLowerCase()) {
        throw new Error('El federado no cumple con el requisito de género');
      }
    }
    if (requisitos.edadDesde || requisitos.edadHasta) {
      if (!federado.nacimiento) throw new Error('No se puede validar edad del federado');
      const nacimiento = new Date(federado.nacimiento);
      if (isNaN(nacimiento.getTime())) throw new Error('Fecha de nacimiento inválida');
      const hoy = new Date(campeonato.inicio || Date.now());
      const edad = hoy.getFullYear() - nacimiento.getFullYear();
      if (requisitos.edadDesde && edad < requisitos.edadDesde) throw new Error('El federado no cumple con la edad mínima');
      if (requisitos.edadHasta && edad > requisitos.edadHasta) throw new Error('El federado no cumple con la edad máxima');
    }
    // Ranking validación pendiente - comentada por ahora
    // if (requisitos.rankingDesde || requisitos.rankingHasta) { ... }

  // 3) Verificar cupos disponibles en el campeonato (cada inscripción corresponde a un federado)
  const inscritos = Array.isArray(campeonato.federadosCampeonatoIDs) ? campeonato.federadosCampeonatoIDs.length : 0;
  if (inscritos >= campeonato.cantidadJugadores) throw new Error('No hay cupos disponibles en el campeonato');

    // 4) Crear registro federado-campeonato
    const fcId = `${campeonatoId}-federado-${uid}-${Date.now()}`;
    const federadoCampeonato = new FederadoCampeonato(fcId, 0, null, uid, campeonatoId);
    // If sending an invitation (dobles), persist invite metadata on the federado-campeonato record
    if (inviteeUid && campeonato.dobles) {
      federadoCampeonato.invite = {
        to: inviteeUid,
        estado: 'pendiente',
        fechaEnvio: new Date().toISOString()
      };
    }
    await this.federadoCampeonatoRepository.save(federadoCampeonato.toPlainObject());

    // 5) Actualizar campeonato → agregar referencia al federado-campeonato
    campeonato.federadosCampeonatoIDs = Array.isArray(campeonato.federadosCampeonatoIDs) ? campeonato.federadosCampeonatoIDs : [];
    campeonato.federadosCampeonatoIDs.push(fcId);
    await this.campeonatoRepository.update(campeonatoId, campeonato);

    // 6) Actualizar federado → agregar referencia al federado-campeonato
    federado.federadoCampeonatosIDs = Array.isArray(federado.federadoCampeonatosIDs) ? federado.federadoCampeonatosIDs : [];
    federado.federadoCampeonatosIDs.push(fcId);
    await this.federadoRepository.update(uid, federado);

    // 7) Asociar al la primera etapa
    if (!Array.isArray(campeonato.etapasIDs) || campeonato.etapasIDs.length === 0) {
      // No hay etapas definidas, devolvemos el id de la inscripción
      console.log("no hay etapas registradas")
      return fcId;
    }

    const primeraEtapaId = campeonato.etapasIDs[0];
    const etapa = await this.etapaRepository.findById(primeraEtapaId);
    if (!etapa) return fcId; // etapa no encontrada, ya quedó inscripto en campeonato

    // Round Robin: buscar primer slot vacío en grupos
    if (etapa.tipoEtapa === 'roundRobin' && Array.isArray(etapa.grupos)) {
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      const isInviteExpired = (inv) => {
        if (!inv || !inv.fechaEnvio) return true;
        const envio = new Date(inv.fechaEnvio).getTime();
        return (now - envio) > oneWeekMs;
      };

      let colocado = false;

      // Helper to update partidos for a team slot index
      const actualizarPartidosParaSlot = async (grupo, si) => {
        if (!Array.isArray(grupo.partidos)) return;
        for (const partido of grupo.partidos) {
          if (typeof partido.jugador1Index !== 'undefined' && partido.jugador1Index === si) {
            // For doubles we store equipo arrays
            if (grupo.jugadores[si].players) partido.equipoLocal = grupo.jugadores[si].players;
            else partido.jugador1Id = grupo.jugadores[si].id;
            const partidoId = `${primeraEtapaId}-${grupo.id || 'grupo'}-${partido.id}`;
            try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e){ }
          }
          if (typeof partido.jugador2Index !== 'undefined' && partido.jugador2Index === si) {
            if (grupo.jugadores[si].players) partido.equipoVisitante = grupo.jugadores[si].players;
            else partido.jugador2Id = grupo.jugadores[si].id;
            const partidoId = `${primeraEtapaId}-${grupo.id || 'grupo'}-${partido.id}`;
            try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e){ }
          }
        }
      };

      // First: if this user was invited by someone, accept that invitation
      for (let gi = 0; gi < etapa.grupos.length && !colocado; gi++) {
        const grupo = etapa.grupos[gi];
        if (!Array.isArray(grupo.jugadores)) continue;
        for (let si = 0; si < grupo.jugadores.length && !colocado; si++) {
          const slot = grupo.jugadores[si];
          if (slot && Array.isArray(slot.players) && slot.invitation && slot.invitation.to === uid && slot.invitation.estado === 'pendiente') {
            // Accept invitation
            // find first empty position in players
            const emptyIndex = slot.players.findIndex(p => !p.id);
            if (emptyIndex === -1) continue;
            slot.players[emptyIndex] = { id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() };
            slot.invitation.estado = 'aceptada';
            slot.invitation.fechaAceptacion = new Date().toISOString();
            // actualizar partidos
            await actualizarPartidosParaSlot(grupo, si);
            colocado = true;
            break;
          }
        }
      }

      // If not accepted an invite, and provided inviteeUid -> create invitation slot for inviter
      if (!colocado && inviteeUid && inviteeUid !== uid) {
        for (let gi = 0; gi < etapa.grupos.length && !colocado; gi++) {
          const grupo = etapa.grupos[gi];
          if (!Array.isArray(grupo.jugadores)) continue;
          for (let si = 0; si < grupo.jugadores.length && !colocado; si++) {
            const slot = grupo.jugadores[si];
            if (slot && Array.isArray(slot.players)) {
              // slot empty (both null) and no invitation
              if ((!slot.players[0] || !slot.players[0].id) && (!slot.players[1] || !slot.players[1].id) && !slot.invitation) {
                slot.players[0] = { id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() };
                slot.invitation = { from: uid, to: inviteeUid, fechaEnvio: new Date().toISOString(), estado: 'pendiente' };
                // actualizar partidos (team partially filled)
                await actualizarPartidosParaSlot(grupo, si);
                colocado = true;
                break;
              }
            }
          }
        }
      }

      // Generic placement: fill available slots (no invitation or invitation expired), prefer to fill second spot of partially filled
      if (!colocado) {
        // First try to fill slots with single player and no active (non-expired) invitation
        for (let gi = 0; gi < etapa.grupos.length && !colocado; gi++) {
          const grupo = etapa.grupos[gi];
          if (!Array.isArray(grupo.jugadores)) continue;
          for (let si = 0; si < grupo.jugadores.length && !colocado; si++) {
            const slot = grupo.jugadores[si];
            if (!slot) continue;
            if (Array.isArray(slot.players)) {
              const emptyIndex = slot.players.findIndex(p => !p.id);
              // only consider if there is at least one player already or both empty
              if (emptyIndex !== -1) {
                // if there is an invitation and it's still valid and the invite target is not this user, skip
                if (slot.invitation && !isInviteExpired(slot.invitation) && slot.invitation.to && slot.invitation.to !== uid) continue;
                // Fill first empty position
                slot.players[emptyIndex] = { id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() };
                // if invitation existed but expired, clear it
                if (slot.invitation && isInviteExpired(slot.invitation)) slot.invitation = undefined;
                await actualizarPartidosParaSlot(grupo, si);
                colocado = true;
                break;
              }
            } else {
              // legacy single-slot (not expected in dobles), skip
            }
          }
        }
      }

      // If still not colocado, append to first group as last resort
      if (!colocado) {
        if (etapa.grupos && etapa.grupos.length > 0) {
          const grupo = etapa.grupos[0];
          grupo.jugadores.push({
            id: null,
            players: [ { id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }, { id: null, nombre: null } ],
            posicion: grupo.jugadores.length + 1,
            ganados: 0,
            perdidos: 0,
            puntos: 0,
            setsGanados: 0,
            setsPerdidos: 0,
            juegosGanados: 0,
            juegosPerdidos: 0
          });
          // No hay partidos que actualizar si se agregó al final
        }
      }
    } else if (etapa.tipoEtapa === 'eliminacion' && Array.isArray(etapa.rondas)) {
      // Eliminación: buscar la primera ronda y partido con origen 'inscripcion' y slot vacío
      let asignado = false;
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const isInviteExpired = (inv) => {
        if (!inv || !inv.fechaEnvio) return true;
        const envio = new Date(inv.fechaEnvio).getTime();
        return (now - envio) > oneWeekMs;
      };

      for (let ri = 0; ri < etapa.rondas.length && !asignado; ri++) {
        const ronda = etapa.rondas[ri];
        if (!Array.isArray(ronda.partidos)) continue;
        for (let pi = 0; pi < ronda.partidos.length && !asignado; pi++) {
          const partido = ronda.partidos[pi];
          // For doubles, partido may be 'eliminacion-dobles' and we should fill equipo arrays
          if (campeonato.dobles) {
            if (partido.jugador1Origen === 'inscripcion' && (!partido.equipoLocal || partido.equipoLocal.length === 0)) {
              // Assign as first member of a team (or accept invitation if exists)
              // If there is an invitation targeting this user in the campeonato first round, accept it
              partido.equipoLocal = [{ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }];
              const partidoId = `${primeraEtapaId}-${ronda.id || 'ronda'}-${partido.id}`;
              try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
              asignado = true;
              break;
            }
            if (partido.jugador2Origen === 'inscripcion' && (!partido.equipoVisitante || partido.equipoVisitante.length === 0)) {
              partido.equipoVisitante = [{ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }];
              const partidoId = `${primeraEtapaId}-${ronda.id || 'ronda'}-${partido.id}`;
              try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
              asignado = true;
              break;
            }
          } else {
            // Solo assign para singles (existing logic)
            if (partido.jugador1Origen === 'inscripcion' && !partido.jugador1Id) {
              partido.jugador1Id = uid;
              partido.jugador1Nombre = `${federado.nombre || ''} ${federado.apellido || ''}`.trim();
              const partidoId = `${primeraEtapaId}-${ronda.id || 'ronda'}-${partido.id}`;
              try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
              asignado = true;
              break;
            }
            if (partido.jugador2Origen === 'inscripcion' && !partido.jugador2Id) {
              partido.jugador2Id = uid;
              partido.jugador2Nombre = `${federado.nombre || ''} ${federado.apellido || ''}`.trim();
              const partidoId = `${primeraEtapaId}-${ronda.id || 'ronda'}-${partido.id}`;
              try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
              asignado = true;
              break;
            }
          }
        }
      }
    }

    // Guardar etapa actualizada
    await this.etapaRepository.save({ id: etapa.id, ...etapa });

    return fcId;
  }
}

export default new InscribirFederado();