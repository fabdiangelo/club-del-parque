import DBConnection from "../ports/DBConnection.js";
import NotiConnection from "../ports/NotiConnection.js";
import { EtapaRepository } from "./EtapaRepository.js";

export class PartidoRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async save(partido) {


    try {
      const { temporadaID, canchaID } = partido;


      // Validar solo si vienen explícitamente temporadaID o canchaID
      if (typeof temporadaID !== 'undefined' && temporadaID !== null) {
        const temp = await this.db.getItem("temporadas", temporadaID);
        if (!temp) {
          throw new Error("La temporada asociada no existe");
        }
      }

      if (typeof canchaID !== 'undefined' && canchaID !== null) {
        const cancha = await this.db.getItem("canchas", canchaID);
        if (!cancha) {
          throw new Error("La cancha asociada no existe");
        }
      }

      const { jugadores, equipoVisitante, equipoLocal, jugador1, jugador2 } = partido;

      // Validar jugadores (plantel completo)
      for (const j of jugadores || []) {
        const jugadorExists = await this.db.getItem("usuarios", j);
        if (!jugadorExists) {
          const fedExists = await this.db.getItem("federados", j);
          if (!fedExists) {
            throw new Error(`El jugador con ID ${j} no existe`);
          }
        }
      }

      // Prefer jugador1/jugador2 arrays when present (dobles). Fallback to equipoLocal/equipoVisitante for legacy data.
      const localCandidates = Array.isArray(jugador1)
        ? jugador1.map(p => p?.id).filter(Boolean)
        : Array.isArray(equipoLocal)
          ? equipoLocal
          : [];

      for (const j of localCandidates) {
        const equipoExists = await this.db.getItem("usuarios", j);
        if (!equipoExists) {
          const fedExists = await this.db.getItem("federados", j);
          if (!fedExists) {
            throw new Error(`El jugador ID ${j} no existe`);
          }
        }
      }

      const visitCandidates = Array.isArray(jugador2)
        ? jugador2.map(p => p?.id).filter(Boolean)
        : Array.isArray(equipoVisitante)
          ? equipoVisitante
          : [];

      for (const j of visitCandidates) {
        const equipoExists = await this.db.getItem("usuarios", j);
        if (!equipoExists) {
          const fedExists = await this.db.getItem("federados", j);
          if (!fedExists) {
            throw new Error(`El jugador con ID ${j} no existe`);
          }
        }
      }

      // Agregar fechaMaxima por defecto si no está definida
      if (!partido.fechaMaxima) {
        const hoy = new Date();
        const dosSemanasDespues = new Date(hoy.setDate(hoy.getDate() + 14));
        partido.fechaMaxima = dosSemanasDespues.toISOString(); // Formato ISO para consistencia
      }

      const doc = await this.db.putItem("partidos", partido, partido.id);
      return doc.id;
    } catch (error) {
      throw error;
    }

  }

  async getById(partidoId) {
    const data = await this.db.getItem("partidos", partidoId);

    if (!data) {
      return null;
    }
    return { id: partidoId, ...data };
  }

  async getAll() {
    return await this.db.getAllItems("partidos");
  }

  async update(partidoId, partido) {
    const updated = await this.db.updateItem("partidos", partidoId, partido);

    // If this partido is part of an etapa, propagate fechaProgramada/estado to the etapa structure
    try {
      const etapaId = partido?.etapa;
      if (etapaId) {
        const etapaRepo = new EtapaRepository();
        const etapa = await etapaRepo.findById(etapaId).catch(() => null);
        if (etapa) {
          let changed = false;

          // Handle roundRobin groups
          if (Array.isArray(etapa.grupos)) {
            for (const grupo of etapa.grupos) {
              if (!Array.isArray(grupo.partidos)) continue;
              for (const p of grupo.partidos) {
                // p.id might already be the full persisted id or the raw id.
                const expectedId = String(p.id || '').startsWith(`${etapa.id}-${grupo.id}-`) ? p.id : `${etapa.id}-${grupo.id}-${p.id}`;
                if (String(expectedId) === String(partidoId)) {
                  // update fields
                  p.fechaProgramada = partido.fechaProgramada || p.fechaProgramada;
                  p.estado = partido.estado || p.estado;
                  changed = true;
                }
              }
            }
          }

          // Handle elimination rounds
          if (Array.isArray(etapa.rondas)) {
            for (const ronda of etapa.rondas) {
              if (!Array.isArray(ronda.partidos)) continue;
              for (const p of ronda.partidos) {
                const expectedId = String(p.id || '').startsWith(`${etapa.id}-${ronda.id}-`) ? p.id : `${etapa.id}-${ronda.id}-${p.id}`;
                if (String(expectedId) === String(partidoId)) {
                  p.fechaProgramada = partido.fechaProgramada || p.fechaProgramada;
                  p.estado = partido.estado || p.estado;
                  // also attach cancha if present
                  if (partido.canchaID || partido.canchaId) p.canchaID = partido.canchaID || partido.canchaId;
                  changed = true;
                }
              }
            }
          }

          if (changed) {
            await etapaRepo.save({ id: etapa.id, ...etapa }).catch((e) => {
              console.warn('No se pudo persistir etapa tras actualizar partido:', e?.message || e);
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error propagando cambios a etapa desde PartidoRepository.update:', e?.message || e);
    }

    return updated;
  }

  async getPartidosPorTemporada(temporadaID) {
    return await this.db.getItemsByField("partidos", "temporadaID", temporadaID);
  }

  async delete(partidoId) {
    return await this.db.deleteItem("partidos", partidoId);
  }

  /**
   * Devuelve los partidos en los que participa un jugador (compat: `jugadores` o `federadosPartidoIDs`)
   */
  async getPartidosPorJugador(jugadorID) {
    const federado = await this.db.getItem("federados", jugadorID);
    const partidosFederadoIDs = federado?.federadoPartidosIDs || [];

    if (partidosFederadoIDs.length > 0) {
      const partidos = [];
      for (const pid of partidosFederadoIDs) {
        const partido = await this.db.getItem("partidos", pid);
        if (partido) {
          partidos.push({ id: pid, ...partido });
        }
      }
      return partidos;
    }
    return [];
  }

  /**
   * Agrega/mezcla disponibilidad para un partido.
   * Estructura guardada:
   * disponibilidades: { propuestoPor: <usuarioId|null>, propuestas: Array<{...}> }
   */

  async aceptarPropuesta(partidoId, propuestaId) {
    if (!partidoId) throw new Error("partidoId requerido");
    if (!propuestaId) throw new Error("propuestaId requerido");

    const partido = await this.db.getItem("partidos", partidoId);

    if (!partido) throw new Error("Partido no encontrado");

    const disponibilidades = partido.disponibilidades || {};

    const propuestas = Array.isArray(disponibilidades.propuestas) ? disponibilidades.propuestas : [];

    // Marcar la propuesta aceptada y programar la fecha del partido si viene
    let acceptedProposal = null;
    for (const propuesta of propuestas) {
      if (propuesta.id === propuestaId) {
        propuesta.aceptada = true;
        acceptedProposal = propuesta;
      }
    }

    // Si se encontró y contiene fechaHoraInicio / fechaHoraFin, programar el partido
    const updatedPartido = {
      ...partido,
      disponibilidades: {
        ...disponibilidades,
        propuestas
      }
    };

    if (acceptedProposal) {
      if (acceptedProposal.fechaHoraInicio) updatedPartido.fechaProgramada = acceptedProposal.fechaHoraInicio;
      else if (acceptedProposal.fechaHoraInicio === undefined && acceptedProposal.fecha && acceptedProposal.horaInicio) updatedPartido.fechaProgramada = `${acceptedProposal.fecha}T${acceptedProposal.horaInicio}`;
      // Cambiar estado a programado si se agendó
      if (updatedPartido.fechaProgramada) updatedPartido.estado = 'programado';
    }

    await this.update(partidoId, updatedPartido);



    return { success: true, message: "Propuesta aceptada correctamente" };
  }

  async addDisponibilidad(partidoId, disponibilidad = [], usuarioId = null) {
    if (!partidoId) throw new Error("partidoId requerido");
    if (!Array.isArray(disponibilidad)) throw new Error("disponibilidad debe ser un array");

    const actual = await this.db.getItem("partidos", partidoId);
    if (!actual) throw new Error("Partido no encontrado");

    const prev = Array.isArray(actual?.disponibilidades?.propuestas)
      ? actual.disponibilidades.propuestas
      : Array.isArray(actual?.disponibilidades)
        ? actual.disponibilidades // compat con versiones previas
        : [];

    // Normalizar entradas (acepta: horaInicio, horaFin, fecha, fechaHoraInicio, fechaHoraFin, rango)
    const norm = (disponibilidad || [])
      .map((d) => ({
        id: d.id || `${Date.now()}_${Math.random()}`,
        fecha: d.fecha,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
        fechaHoraInicio:
          d.fechaHoraInicio ||
          (d.fecha && d.horaInicio ? `${d.fecha}T${d.horaInicio}` : undefined),
        fechaHoraFin:
          d.fechaHoraFin ||
          (d.fecha && d.horaFin ? `${d.fecha}T${d.horaFin}` : undefined),
        rango: d.rango || (d.horaInicio && d.horaFin ? `${d.horaInicio} - ${d.horaFin}` : undefined),
        usuarioId: d.usuarioId || usuarioId || null,
        submittedAt: Date.now(),
      }))
      .filter((it) => it.fecha && it.horaInicio && it.horaFin);

    // Merge por (usuario|fecha|horaInicio|horaFin)
    const key = (it) =>
      `${it.usuarioId || "anon"}|${it.fecha}|${it.horaInicio}|${it.horaFin}`;
    const map = new Map();
    [...prev, ...norm].forEach((it) => {
      map.set(key(it), it);
    });

    const merged = Array.from(map.values());

    const updated = {
      ...actual,
      disponibilidades: {
        propuestoPor:
          actual?.disponibilidades?.propuestoPor ||
          merged[0]?.usuarioId ||
          usuarioId ||
          null,
        propuestas: merged,
      },
    };





    await this.update(partidoId, updated);


    const jugadores = actual.jugadores || [];
    const noti = new NotiConnection();

    const inviteePayload = {
      tipo: "actualizacion_partido",
      resumen: "El equipo contrario ha propuesto horarios disponibles parajugar el partido",
      href: `/partido/${partidoId}`,
    };

    let equipoProponiente = null;

    if (actual?.equipoLocal?.includes(disponibilidad.propuestoPor) || (actual?.jugador1?.isArray && actual?.jugador1?.includes(disponibilidad.propuestoPor)) || disponibilidad.propuestoPor == actual?.jugador1?.id) {
      equipoProponiente = 'local';
    } else {
      equipoProponiente = 'visitante';
    }

    for (const jugadorId of jugadores) {
      const perteneceAlEquipoProponiente = equipoProponiente === 'local'
        ? actual.equipoLocal?.includes(jugadorId) || actual.jugador1?.includes(jugadorId)
        : actual.equipoVisitante?.includes(jugadorId) || actual.jugador2?.includes(jugadorId);

      if (jugadorId !== disponibilidad.propuestoPor && !perteneceAlEquipoProponiente) {
        await noti.pushNotificationTo(jugadorId, inviteePayload).catch(() => { });
      }
    }

    return merged;
  }

}


