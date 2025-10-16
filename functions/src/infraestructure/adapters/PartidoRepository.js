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
                throw new Error(`El jugador con ID ${j} no existe`);
            }
        }

        // Validar equipo local
        for (const j of equipoLocal) {
            const equipoExists = await this.db.getItem("usuarios", j);
            if (!equipoExists) {
                throw new Error(`El equipo local con ID ${j} no existe`);
            }
        }

        for (const j of equipoVisitante) {
            const equipoExists = await this.db.getItem("usuarios", j);
            if (!equipoExists) {
                throw new Error(`El equipo visitante con ID ${j} no existe`);
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

}