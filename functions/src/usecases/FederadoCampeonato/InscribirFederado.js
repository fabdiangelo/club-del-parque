
import FederadoCampeonato from "../../domain/entities/FederadoCampeonato.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { FederadoCampeonatoRepository } from "../../infraestructure/adapters/FederadoCampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";
import NotiConnection from "../../infraestructure/ports/NotiConnection.js";

class InscribirFederado {
  constructor() {
    this.campeonatoRepository = new CampeonatoRepository();
    this.federadoRepository = new FederadoRepository();
    this.federadoCampeonatoRepository = new FederadoCampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
    this.partidoRepository = new PartidoRepository();
    this.notiConnection = new NotiConnection();
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

    console.log(federado)

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

    // Validar requisitosParticipacion (género, edad, ranking)
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
    // Validación de ranking
    if (requisitos.rankingDesde || requisitos.rankingHasta) {
      // Obtener rankings del federado desde la DB
      const { RankingRepository } = await import("../../infraestructure/adapters/RankingRepository.js");
      const rankingRepo = new RankingRepository();
      // Determinar los valores a comparar
      const genero = requisitos.genero && requisitos.genero !== 'ambos' ? requisitos.genero.toLowerCase() : (federado.genero ? federado.genero.toLowerCase() : undefined);
      const tipoDePartido = campeonato.dobles ? 'dobles' : 'singles';
      const temporada = campeonato.temporada;
      const deporte = campeonato.deporte;
      // Buscar rankings del usuario que coincidan en tipo, deporte, temporada
      const rankings = await rankingRepo.getByUsuario(uid);
      const rankingValido = rankings.find(rk => {
        if (!rk) return false;
        // Coincidencia de género (si aplica)
        if (genero && rk.genero && rk.genero.toLowerCase() !== genero.toLowerCase()) return false;
        // Coincidencia de tipoDePartido
        if (rk.tipoDePartido.toLowerCase() !== tipoDePartido.toLowerCase()) return false;
        // Coincidencia de temporada
        if (temporada && rk.temporadaID !== temporada) return false;
        // Coincidencia de deporte
        if (deporte && rk.deporte.toLowerCase() !== deporte.toLowerCase()) return false;
        // Si pasa todos los filtros, es válido
        return true;
      });
      if (!rankingValido) {
        throw new Error('El federado no tiene ranking válido para este campeonato');
      }
      // Validar el valor del ranking (campo puede ser "valor" o "puntos")
      const valorRanking = typeof rankingValido.valor !== 'undefined' ? rankingValido.valor : rankingValido.puntos;
      if (requisitos.rankingDesde && valorRanking < requisitos.rankingDesde) {
        throw new Error('El federado no cumple con el ranking mínimo');
      }
      if (requisitos.rankingHasta && valorRanking > requisitos.rankingHasta) {
        throw new Error('El federado no cumple con el ranking máximo');
      }
    }

  // 3) Verificar cupos disponibles en el campeonato (cada inscripción corresponde a un federado)
  const inscritos = Array.isArray(campeonato.federadosCampeonatoIDs) ? campeonato.federadosCampeonatoIDs.length : 0;
  if (inscritos >= campeonato.cantidadJugadores) throw new Error('No hay cupos disponibles en el campeonato');

    // If inviteeUid provided, prevent inviting someone already inscripto
    if (inviteeUid && campeonato.dobles) {
      const existingInvitee = await this.federadoCampeonatoRepository.db.getItemsByField(this.federadoCampeonatoRepository.collection, 'federadoID', inviteeUid);
      const yaInscriptoInvitee = Array.isArray(existingInvitee) ? existingInvitee.find(x => x.campeonatoID === campeonatoId) : null;
      if (yaInscriptoInvitee) throw new Error('No se puede invitar a un usuario que ya está inscripto');
    }

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

    // Helper: resolve partido id — some stored partido.id values are already the full persisted id
    // (created in CrearCampeonato as `${etapaId}-${grupoOrRonda}-${partido.id}`), so avoid double-prefixing.
    const resolvePartidoId = (partidoRef, containerId) => {
      if (!partidoRef || typeof partidoRef.id === 'undefined' || partidoRef.id === null) {
        return `${primeraEtapaId}-${containerId || 'partido'}-${partidoRef?.id || ''}`;
      }
      const pid = String(partidoRef.id);
      if (pid.startsWith(String(primeraEtapaId))) return pid;
      return `${primeraEtapaId}-${containerId || 'partido'}-${pid}`;
    };

    const buildJugadoresArray = (p) => {
      const ids = [];
      try {
        if (Array.isArray(p.jugador1) && p.jugador1.length) ids.push(...p.jugador1);
        else if (p.jugador1Id) ids.push(String(p.jugador1Id));

        if (Array.isArray(p.jugador2) && p.jugador2.length) ids.push(...p.jugador2);
        else if (p.jugador2Id) ids.push(String(p.jugador2Id));
      } catch (e) { /* ignore */ }
      return ids;
    };

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
            // For doubles store team in jugador1 array; for singles use jugador1Id
            if (grupo.jugadores[si].players) {
              // dobles: copy players (with names)
              partido.jugador1 = grupo.jugadores[si].players.map(p => ({ id: p.id, nombre: p.nombre }));
              partido.equipoLocal = partido.jugador1.map(p => String(p.id));
            } else {
              // singles: set id and nombre
              partido.jugador1Id = grupo.jugadores[si].id;
              partido.jugador1Nombre = grupo.jugadores[si].nombre || null;
            }
            const partidoId = resolvePartidoId(partido, grupo.id || 'grupo');
            partido.jugadores = buildJugadoresArray(partido);
            try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e){ }
          }
          if (typeof partido.jugador2Index !== 'undefined' && partido.jugador2Index === si) {
            if (grupo.jugadores[si].players) {
              partido.jugador2 = grupo.jugadores[si].players.map(p => ({ id: p.id, nombre: p.nombre }));
              partido.equipoVisitante = partido.jugador2.map(p => String(p.id));
            } else {
              partido.jugador2Id = grupo.jugadores[si].id;
              partido.jugador2Nombre = grupo.jugadores[si].nombre || null;
            }
            const partidoId = resolvePartidoId(partido, grupo.id || 'grupo');
            partido.jugadores = buildJugadoresArray(partido);
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
                // notify invitee via RTDB
                try {
                  await this.notiConnection.pushNotificationTo(inviteeUid, {
                    tipo: 'invitacion_recibida',
                    resumen: `Has recibido una invitación de ${federado.nombre || ''} ${federado.apellido || ''}`.trim(),
                    href: `/campeonato/${campeonatoId}`,
                    campeonatoId: campeonatoId,
                    from: uid
                  });
                } catch (e) { /* ignore */ }
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
                // if the invitation explicitly targets this user but was rejected earlier, do NOT assign this team to them
                if (slot.invitation && slot.invitation.to === uid && slot.invitation.estado === 'rechazada') continue;
                // Fill first empty position
                slot.players[emptyIndex] = { id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() };
                // if invitation existed but expired, clear it
                if (slot.invitation && isInviteExpired(slot.invitation)) slot.invitation = undefined;
                await actualizarPartidosParaSlot(grupo, si);
                colocado = true;
                break;
              }
            } else {
              // legacy single-slot (singles tournaments): assign if empty
              // slot expected to have .id and .nombre
              if (!slot.id) {
                slot.id = uid;
                slot.nombre = `${federado.nombre || ''} ${federado.apellido || ''}`.trim();
                await actualizarPartidosParaSlot(grupo, si);
                colocado = true;
                break;
              }
            }
          }
        }
      }

      // If still not colocado, append to first group as last resort
      if (!colocado) {
        if (etapa.grupos && etapa.grupos.length > 0) {
          const grupo = etapa.grupos[0];
          if (campeonato.dobles) {
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
          } else {
            // singles: push single slot
            grupo.jugadores.push({
              id: uid,
              nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim(),
              posicion: grupo.jugadores.length + 1,
              ganados: 0,
              perdidos: 0,
              puntos: 0,
              setsGanados: 0,
              setsPerdidos: 0,
              juegosGanados: 0,
              juegosPerdidos: 0
            });
            // attempt to update partidos for newly appended slot
            const si = grupo.jugadores.length - 1;
            await actualizarPartidosParaSlot(grupo, si);
          }
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
            // jugador1 (team) origin: try to assign first empty slot, or fill the second spot if there's already one player
            if (partido.jugador1Origen === 'inscripcion') {
              // If no team yet, create team with this player
              if (!partido.jugador1 || partido.jugador1.length === 0) {
                partido.jugador1 = [{ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }];
                const partidoId = resolvePartidoId(partido, ronda.id || 'ronda');
                partido.jugadores = buildJugadoresArray(partido);
                try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
                asignado = true;
                break;
              }

              // If there is a single player in the team, and there is no explicit pending invitation, allow the next registrant to fill the second spot
              if (Array.isArray(partido.jugador1) && partido.jugador1.length === 1) {
                // Detect common invitation markers (if present). If any pending invitation exists, skip auto-fill.
                const jugador1HasPendingInvite = (partido.jugador1Invitation && partido.jugador1Invitation.estado === 'pendiente') ||
                  (partido.jugador1Invite && partido.jugador1Invite.estado === 'pendiente') ||
                  (partido.jugador1Invitacion && partido.jugador1Invitacion.estado === 'pendiente') ||
                  (partido.invitation && partido.invitation.estado === 'pendiente') ||
                  (partido.invitacion && partido.invitacion.estado === 'pendiente');

                // Only add if the existing player isn't the same uid and there's no pending invite
                if (!jugador1HasPendingInvite && partido.jugador1[0].id !== uid) {
                  partido.jugador1.push({ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() });
                  const partidoId = resolvePartidoId(partido, ronda.id || 'ronda');
                  partido.jugadores = buildJugadoresArray(partido);
                  try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
                  asignado = true;
                  break;
                }
              }
            }

            // jugador2 (team) origin: same logic as jugador1
            if (partido.jugador2Origen === 'inscripcion') {
              if (!partido.jugador2 || partido.jugador2.length === 0) {
                partido.jugador2 = [{ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }];
                const partidoId = resolvePartidoId(partido, ronda.id || 'ronda');
                try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
                asignado = true;
                break;
              }

              if (Array.isArray(partido.jugador2) && partido.jugador2.length === 1) {
                const jugador2HasPendingInvite = (partido.jugador2Invitation && partido.jugador2Invitation.estado === 'pendiente') ||
                  (partido.jugador2Invite && partido.jugador2Invite.estado === 'pendiente') ||
                  (partido.jugador2Invitacion && partido.jugador2Invitacion.estado === 'pendiente') ||
                  (partido.invitation && partido.invitation.estado === 'pendiente') ||
                  (partido.invitacion && partido.invitacion.estado === 'pendiente');

                if (!jugador2HasPendingInvite && partido.jugador2[0].id !== uid) {
                  partido.jugador2.push({ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() });
                  const partidoId = resolvePartidoId(partido, ronda.id || 'ronda');
                  partido.jugadores = buildJugadoresArray(partido);
                  try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
                  asignado = true;
                  break;
                }
              }
            }
          } else {
            // Solo assign para singles: almacenar como array de jugadores [{id,nombre}] para mantener consistencia con roundRobin
            if (partido.jugador1Origen === 'inscripcion') {
              // asignar solo si no hay jugador1 en la estructura (compatibilidad con distintos formatos)
              if (!Array.isArray(partido.jugador1) || partido.jugador1.length === 0 || !partido.jugador1[0]?.id) {
                partido.jugador1 = [{ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }];
                const partidoId = resolvePartidoId(partido, ronda.id || 'ronda');
                partido.jugadores = buildJugadoresArray(partido);
                try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
                asignado = true;
                break;
              }
            }

            if (partido.jugador2Origen === 'inscripcion') {
              if (!Array.isArray(partido.jugador2) || partido.jugador2.length === 0 || !partido.jugador2[0]?.id) {
                partido.jugador2 = [{ id: uid, nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim() }];
                const partidoId = resolvePartidoId(partido, ronda.id || 'ronda');
                try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
                asignado = true;
                break;
              }
            }
          }
        }
      }
    }

    // Guardar etapa actualizada
    await this.etapaRepository.save({ id: etapa.id, ...etapa });

    // 8) Registrar en el federado los partidos asignados dentro de esta etapa (federadoPartidosIDs)
    try {
      const partidoIdsToAdd = new Set();
      const primeraEtapa = primeraEtapaId; // ya tenemos la variable

      if (etapa.tipoEtapa === 'roundRobin' && Array.isArray(etapa.grupos)) {
        for (const grupo of etapa.grupos) {
          if (!Array.isArray(grupo.partidos)) continue;
          for (const partido of grupo.partidos) {
            const pid = resolvePartidoId(partido, grupo.id || 'grupo');
            // comprobar si el federado participa en este partido
            const jugadores1 = Array.isArray(partido.jugador1) ? partido.jugador1.map(p => (typeof p === 'string' ? p : (p?.id || p?.uid))).filter(Boolean) : (partido.jugador1Id ? [partido.jugador1Id] : []);
            const jugadores2 = Array.isArray(partido.jugador2) ? partido.jugador2.map(p => (typeof p === 'string' ? p : (p?.id || p?.uid))).filter(Boolean) : (partido.jugador2Id ? [partido.jugador2Id] : []);
            if (jugadores1.includes(uid) || jugadores2.includes(uid)) partidoIdsToAdd.add(pid);
          }
        }
      } else if (etapa.tipoEtapa === 'eliminacion' && Array.isArray(etapa.rondas)) {
        for (const ronda of etapa.rondas) {
          if (!Array.isArray(ronda.partidos)) continue;
          for (const partido of ronda.partidos) {
            const pid = resolvePartidoId(partido, ronda.id || 'ronda');
            const jugadores1 = Array.isArray(partido.jugador1) ? partido.jugador1.map(p => (typeof p === 'string' ? p : (p?.id || p?.uid))).filter(Boolean) : (partido.jugador1Id ? [partido.jugador1Id] : []);
            const jugadores2 = Array.isArray(partido.jugador2) ? partido.jugador2.map(p => (typeof p === 'string' ? p : (p?.id || p?.uid))).filter(Boolean) : (partido.jugador2Id ? [partido.jugador2Id] : []);
            if (jugadores1.includes(uid) || jugadores2.includes(uid)) partidoIdsToAdd.add(pid);
          }
        }
      }

      if (partidoIdsToAdd.size > 0) {
        federado.federadoPartidosIDs = Array.isArray(federado.federadoPartidosIDs) ? federado.federadoPartidosIDs : [];
        const existentes = new Set(federado.federadoPartidosIDs.map(x => String(x)));
        let changed = false;
        for (const pid of partidoIdsToAdd) {
          if (!existentes.has(pid)) {
            federado.federadoPartidosIDs.push(pid);
            changed = true;
          }
        }
        if (changed) {
          try {
            await this.federadoRepository.update(uid, federado);
          } catch (e) {
            console.warn('No se pudo actualizar federadoPartidosIDs para federado', uid, e);
          }
        }
      }
    } catch (e) {
      console.warn('Error al registrar federadoPartidosIDs tras inscripcion:', e);
    }

    return fcId;
  }
}

export default new InscribirFederado();