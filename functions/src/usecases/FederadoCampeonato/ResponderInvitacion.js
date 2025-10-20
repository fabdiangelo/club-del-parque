import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { FederadoCampeonatoRepository } from "../../infraestructure/adapters/FederadoCampeonatoRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import NotiConnection from "../../infraestructure/ports/NotiConnection.js";
import FederadoCampeonato from "../../domain/entities/FederadoCampeonato.js";

class ResponderInvitacion {
  constructor() {
    this.campeonatoRepo = new CampeonatoRepository();
    this.etapaRepo = new EtapaRepository();
    this.fedCamRepo = new FederadoCampeonatoRepository();
    this.partidoRepo = new PartidoRepository();
    this.fedRepo = new FederadoRepository();
    this.notiConnection = new NotiConnection();
  }

  // action: 'aceptar' | 'rechazar'
  async execute(inviteeUid, campeonatoId, action = 'aceptar') {
    if (!inviteeUid) throw new Error('inviteeUid requerido');
    if (!campeonatoId) throw new Error('campeonatoId requerido');

    const campeonato = await this.campeonatoRepo.findById(campeonatoId);
    if (!campeonato) throw new Error('Campeonato no encontrado');

    // find the first etapa (where invitations are stored)
    if (!Array.isArray(campeonato.etapasIDs) || campeonato.etapasIDs.length === 0) {
      throw new Error('Campeonato sin etapas');
    }
    const etapaId = campeonato.etapasIDs[0];
    const etapa = await this.etapaRepo.findById(etapaId);
    if (!etapa) throw new Error('Etapa no encontrada');

  let found = false;
  let matchedGrupo = null;
  let matchedSlot = null;
  let matchedInviterUid = null;
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const isInviteExpired = (inv) => {
      if (!inv || !inv.fechaEnvio) return true;
      const envio = new Date(inv.fechaEnvio).getTime();
      return (now - envio) > oneWeekMs;
    };

    // Scan groups and slots to find invitations targeting this invitee
    if (Array.isArray(etapa.grupos)) {
      for (const grupo of etapa.grupos) {
        if (!Array.isArray(grupo.jugadores)) continue;
        for (const slot of grupo.jugadores) {
          if (!slot || !slot.invitation) continue;
          const inv = slot.invitation;
          if (inv.to !== inviteeUid) continue;
          // Only consider pending invites (or expired when accepting)
          if (action === 'aceptar') {
            if (inv.estado !== 'pendiente' && !isInviteExpired(inv)) continue;
            // accept: fill empty position if any
            if (Array.isArray(slot.players)) {
              const emptyIndex = slot.players.findIndex(p => !p.id);
              if (emptyIndex === -1) {
                // slot already full
                slot.invitation.estado = 'aceptada';
                slot.invitation.fechaAceptacion = new Date().toISOString();
              } else {
                const federado = await this.fedRepo.getFederadoById(inviteeUid);
                slot.players[emptyIndex] = { id: inviteeUid, nombre: `${federado?.nombre || ''} ${federado?.apellido || ''}`.trim() };
                slot.invitation.estado = 'aceptada';
                slot.invitation.fechaAceptacion = new Date().toISOString();
              }
            }
            // update partidos referencing this slot
            if (Array.isArray(grupo.partidos)) {
              for (const partido of grupo.partidos) {
                if (typeof partido.jugador1Index !== 'undefined' && partido.jugador1Index === slot.posicion - 1) {
                  if (slot.players) {
                    partido.jugador1 = slot.players;
                  }
                  const partidoId = `${etapaId}-${grupo.id || 'grupo'}-${partido.id}`;
                  await this.partidoRepo.update(partidoId, { ...partido }).catch(() => {});
                }
                if (typeof partido.jugador2Index !== 'undefined' && partido.jugador2Index === slot.posicion - 1) {
                  if (slot.players) {
                    partido.jugador2 = slot.players;
                  }
                  const partidoId = `${etapaId}-${grupo.id || 'grupo'}-${partido.id}`;
                  await this.partidoRepo.update(partidoId, { ...partido }).catch(() => {});
                }
              }
            }
            // store matched slot info so we can create a new federado-campeonato for the invitee later
            matchedGrupo = grupo;
            matchedSlot = slot;
            matchedInviterUid = inv.from;
            found = true;
            break;
          } else {
            // reject
            slot.invitation.estado = 'rechazada';
            slot.invitation.fechaRespuesta = new Date().toISOString();
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    // Save etapa if modified
    if (found) {
      await this.etapaRepo.save({ id: etapa.id, ...etapa });

    }

    // Update federado-campeonato records: find any federado-campeonato entries that have invite.to === inviteeUid and campeonatoID matches
    const allFcs = await this.fedCamRepo.getAllFederados();
    const related = Array.isArray(allFcs) ? allFcs.filter(f => f.campeonatoID === campeonatoId && f.invite && f.invite.to === inviteeUid) : [];

    // We'll create a new FederadoCampeonato for the invitee when they accept (linked to the matched slot if available)
    let createdFcId = null;

    for (const fc of related) {
      // For inviters: update their invite state
      fc.invite = fc.invite || {};
      if (action === 'aceptar') {
        fc.invite.estado = 'aceptada';
        fc.invite.fechaAceptacion = new Date().toISOString();
      } else {
        fc.invite.estado = 'rechazada';
        fc.invite.fechaRespuesta = new Date().toISOString();
      }
      await this.fedCamRepo.update(fc.id, fc).catch(() => {});

      // If this inviter corresponds to the matched slot, create a NEW federado-campeonato for the invitee
      if (action === 'aceptar' && matchedInviterUid && fc.federadoID === matchedInviterUid && !createdFcId) {
        const newFcId = `${campeonatoId}-federado-${inviteeUid}-${Date.now()}`;
        const newFc = new FederadoCampeonato(newFcId, 0, null, inviteeUid, campeonatoId);
        // populate associations if we know them
        if (etapa && etapa.id) newFc.etapaID = etapa.id;
        if (matchedGrupo && matchedGrupo.id) newFc.grupoID = matchedGrupo.id;
        if (matchedSlot && typeof matchedSlot.posicion !== 'undefined') newFc.posicion = matchedSlot.posicion;
        createdFcId = await this.fedCamRepo.save(newFc.toPlainObject()).catch(() => null);

        // add to campeonato.federadosCampeonatoIDs if created
        if (createdFcId) {
          campeonato.federadosCampeonatoIDs = Array.isArray(campeonato.federadosCampeonatoIDs) ? campeonato.federadosCampeonatoIDs : [];
          campeonato.federadosCampeonatoIDs.push(createdFcId);
          await this.campeonatoRepo.update(campeonato.id, campeonato).catch(() => {});

          // update invitee federado record to reference this new inscription
          try {
            const inviteeFed = await this.fedRepo.getFederadoById(inviteeUid);
            inviteeFed.federadoCampeonatosIDs = Array.isArray(inviteeFed.federadoCampeonatosIDs) ? inviteeFed.federadoCampeonatosIDs : [];
            inviteeFed.federadoCampeonatosIDs.push(createdFcId);
            await this.fedRepo.update(inviteeUid, inviteeFed).catch(() => {});
          } catch (e) {
            // ignore update errors for federado
          }
        }
      }
    }

    // If accepted: cancel other pending invitations targeting this invitee for the same championship
    if (action === 'aceptar') {
      for (const fc of related) {
        // mark any other invites (if any) as 'cancelada' except the accepted one we already marked
        // actually 'related' contains all; we want to cancel invites from other inviters - set to 'cancelada'
        if (fc.invite && fc.invite.estado === 'pendiente') {
          fc.invite.estado = 'cancelada';
          fc.invite.fechaRespuesta = new Date().toISOString();
          await this.fedCamRepo.update(fc.id, fc).catch(() => {});
        }
      }
    }

    // Notifications: notify inviters
    for (const fc of related) {
      const inviterUid = fc.federadoID;
      if (!inviterUid) continue;
      const payload = {
        tipo: action === 'aceptar' ? 'invitacion_aceptada' : 'invitacion_rechazada',
        resumen: action === 'aceptar' ? `Tu invitación fue aceptada por ${inviteeUid}` : `Tu invitación fue rechazada por ${inviteeUid}`,
        href: `/campeonato/${campeonatoId}`,
      };
      await this.notiConnection.pushNotificationTo(inviterUid, payload).catch(() => {});
    }

    // Also notify the invitee a confirmation
    const inviteePayload = {
      tipo: action === 'aceptar' ? 'invitacion_confirmada' : 'invitacion_rechazada_confirm',
      resumen: action === 'aceptar' ? `Has aceptado la invitación para el campeonato ${campeonato?.nombre || ''}` : `Has rechazado la invitación para el campeonato ${campeonato?.nombre || ''}`,
      href: `/campeonato/${campeonatoId}`,
    };
    await this.notiConnection.pushNotificationTo(inviteeUid, inviteePayload).catch(() => {});

    return { ok: true };
  }
}

export default new ResponderInvitacion();
