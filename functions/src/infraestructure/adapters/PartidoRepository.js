import DBConnection from "../ports/DBConnection.js";
import NotiConnection from "../ports/NotiConnection.js";

export class PartidoRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async save(partido) {
    const { temporadaID } = partido;


    const temp = await this.db.getItem("temporadas", temporadaID);
    const cancha = await this.db.getItem("canchas", partido.canchaID);

    if (!temp) {
      throw new Error("La temporada asociada no existe");
    }

    if (!cancha) {
      throw new Error("La cancha asociada no existe");
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
    console.log("Se ha creado el partido con id: " + doc.id);
    return doc.id;
  }

  async getById(partidoId) {
    console.log("PartidoRepository.getById llamado con ID:", partidoId);
    const data = await this.db.getItem("partidos", partidoId);
    console.log("Datos obtenidos de la DB:", data);

    if (!data) {
      console.log("No se encontraron datos para ID:", partidoId);
      return null;
    }
    return { id: partidoId, ...data };
  }

  async getAll() {
    return await this.db.getAllItems("partidos");
  }

  async update(partidoId, partido) {
    return await this.db.updateItem("partidos", partidoId, partido);
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
    const all = await this.db.getAllItems("partidos");

    // Normalizar a objetos simples que siempre tengan .id
    const list = (Array.isArray(all) ? all : []).map((p) => {
      const d = typeof p?.data === "function" ? p.data() : p; // Firestore o plain
      return d?.id ? d : { id: p?.id, ...(d || {}) };
    });

    return list.filter((partido) => {
      const jugadores = Array.isArray(partido.jugadores)
        ? partido.jugadores
        : Array.isArray(partido.federadosPartidoIDs)
          ? partido.federadosPartidoIDs
          : [];
      return jugadores.includes(jugadorID);
    });
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

    propuestas.map((propuesta) => {
      if (propuesta.id === propuestaId) {
        propuesta.aceptada = true;
      }
    });

    await this.update(partidoId, {
      ...partido,
      disponibilidades: {
        ...disponibilidades,
        propuestas
      }
    });

    

    return { success: true, message: "Propuesta aceptada correctamente" };
  }

  async addDisponibilidad(partidoId, disponibilidad = [], usuarioId = null) {
    if (!partidoId) throw new Error("partidoId requerido");
    if (!Array.isArray(disponibilidad)) throw new Error("disponibilidad debe ser un array");

    const actual = await this.db.getItem("partidos", partidoId);
    if (!actual) throw new Error("Partido no encontrado");

    console.log("Disponibilidad actual:", actual.disponibilidades);
    console.log("Nueva disponibilidad:", disponibilidad);

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

    if (actual.equipoLocal.includes(disponibilidad.propuestoPor)) {
      equipoProponiente = 'local';
    } else {
      equipoProponiente = 'visitante';
    }

    for (const jugadorId of jugadores) {
      const perteneceAlEquipoProponiente = equipoProponiente === 'local'
        ? actual.equipoLocal.includes(jugadorId)
        : actual.equipoVisitante.includes(jugadorId);

      if (jugadorId !== disponibilidad.propuestoPor && !perteneceAlEquipoProponiente) {
        await noti.pushNotificationTo(jugadorId, inviteePayload).catch(() => { });
      }
    }

    return merged;
  }

}


