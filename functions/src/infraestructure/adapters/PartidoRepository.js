import DBConnection from "../ports/DBConnection.js";



export class PartidoRepository {
    constructor() {
        this.db = new DBConnection();
    }


    async save(partido) {
        const {temporadaID } = partido;

        console.log(partido);
       

        const temp = await this.db.getItem("temporadas", temporadaID);
        const cancha = await this.db.getItem("canchas", partido.canchaID);

        console.log("Temporada encontrada:", temp);
        console.log("Cancha encontrada:", cancha);
        if (!temp) {
            throw new Error("La temporada asociada no existe");
        }

        if (!cancha) {
            throw new Error("La cancha asociada no existe");
        }

        const {jugadores, equipoVisitante, equipoLocal} = partido;
        
        for (const j of jugadores) {
            const jugadorExists = await this.db.getItem("usuarios", j);
            if (!jugadorExists) {
                const fedExists = await this.db.getItem("federados", j);
                if (!fedExists) {
                    throw new Error(`El jugador con ID ${j} no existe`);
                }


               
            }
        }

        // Validar equipo local
        for (const j of equipoLocal) {
            const equipoExists = await this.db.getItem("usuarios", j);
            if (!equipoExists) {

                const fedExists = await this.db.getItem("federados", j);
                if (!fedExists) {
                    throw new Error(`El jugador ID ${j} no existe`);
                }

            }
        }

        for (const j of equipoVisitante) {
            const equipoExists = await this.db.getItem("usuarios", j);
            if (!equipoExists) {
                const fedExists = await this.db.getItem("federados", j);
                if (!fedExists) {
                    
                    throw new Error(`El jugador con ID ${j} no existe`);
                }

            }
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

async getPartidosPorJugador(jugadorID) {
  const all = await this.db.getAllItems("partidos");

  // Normalize to plain objects with .id
  const list = (Array.isArray(all) ? all : []).map((p) => {
    const d = typeof p?.data === "function" ? p.data() : p;   // supports Firestore or plain
    return d?.id ? d : { id: p?.id, ...(d || {}) };           // ensure we always have .id
  });

  // Some code uses `jugadores`, older code used `federadosPartidoIDs`.
  return list.filter((partido) => {
    const jugadores =
      Array.isArray(partido.jugadores)
        ? partido.jugadores
        : Array.isArray(partido.federadosPartidoIDs)
          ? partido.federadosPartidoIDs
          : [];
    return jugadores.includes(jugadorID);
  });
}

<<<<<<< Updated upstream
=======
        allPartidos.forEach((doc) => {
            const data = doc.data();
            if (data.federadosPartidoIDs && data.federadosPartidoIDs.includes(federadoID)) {
                partidosList.push({ id: doc.id, ...data });
            }
        });
        return partidosList;
    }

    async addDisponibilidad(partidoId, disponibilidad = [], usuarioId = null) {
        if (!partidoId) throw new Error("partidoId requerido");
        if (!Array.isArray(disponibilidad)) throw new Error("disponibilidad debe ser un array");
        const actual = await this.db.getItem("partidos", partidoId);
        if (!actual) throw new Error("Partido no encontrado");

        console.log("Disponibilidad actual:", actual.disponibilidades);
        console.log("Nueva disponibilidad:", disponibilidad);

        const prev = Array.isArray(actual.disponibilidades) ? actual.disponibilidades : [];
        // Accept horaInicio, horaFin, fechaHoraInicio, fechaHoraFin, rango
        const norm = disponibilidad.map((d) => ({
            id: d.id || Date.now() + Math.random(),
            fecha: d.fecha,
            horaInicio: d.horaInicio,
            horaFin: d.horaFin,
            fechaHoraInicio: d.fechaHoraInicio || (d.fecha && d.horaInicio ? `${d.fecha}T${d.horaInicio}` : undefined),
            fechaHoraFin: d.fechaHoraFin || (d.fecha && d.horaFin ? `${d.fecha}T${d.horaFin}` : undefined),
            rango: d.rango || (d.horaInicio && d.horaFin ? `${d.horaInicio} - ${d.horaFin}` : undefined),
            usuarioId: d.usuarioId || usuarioId || null,
            submittedAt: Date.now(),
        })).filter(it => it.fecha && it.horaInicio && it.horaFin);
        // Merge by user/date/range
        const key = (it) => `${it.usuarioId || 'anon'}|${it.fecha}|${it.horaInicio}|${it.horaFin}`;
        const map = new Map();
        [...prev, ...norm].forEach(it => {
            map.set(key(it), it);
        });
        const merged = Array.from(map.values());
        const updated = {...actual, disponibilidades: {propuestoPor: merged[0]?.usuarioId || null, propuestas: merged} };

        console.log("Guardando partido con disponibilidades:", updated.disponibilidades);
        await this.update(partidoId, updated);
        return merged;
    }
>>>>>>> Stashed changes
}