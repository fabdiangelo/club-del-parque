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

        // Validar equipo visitante
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

    async getPartidosPorJugador(federadoID) {
        const allPartidos = await this.db.getAllItems("partidos");
        const partidosList = [];

        allPartidos.forEach((doc) => {
            const data = doc.data();
            if (data.federadosPartidoIDs && data.federadosPartidoIDs.includes(federadoID)) {
                partidosList.push({ id: doc.id, ...data });
            }
        });
        return partidosList;
    }
}