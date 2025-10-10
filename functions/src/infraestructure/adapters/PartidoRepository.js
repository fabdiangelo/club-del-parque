import DBConnection from "../ports/DBConnection.js";



export class PartidoRepository {
    constructor() {
        this.db = new DBConnection();
    }


    async save(partido) {
        const {temporadaID } = partido;
       

        const temp = this.db.getItemsByField("temporadas", "id", temporadaID);
        const cancha = this.db.getItemsByField("canchas", "id", partido.canchaID);
        if (!temp) {
            throw new Error("La temporada asociada no existe");
        }

        if(!cancha) {
            throw new Error("La cancha asociada no existe");
        }

        if (!cancha) {
            throw new Error("La cancha asociada no existe");
        }

        const doc = this.db.putItem("partidos", partido, partido.id);


        return doc.id;
    }

    async getById(partidoId) {
        const snap = await this.db.getItem("partidos", partidoId);
        if (!snap.exists) {
            return null;
        }
        return snap.data();
    }

    async update(partidoId, partido) {
        return await this.db.updateItem("partidos", partidoId, partido);
    }

    async getPartidosPorTemporada(temporadaID) {
        return await this.db.getItemsByField("partidos", "temporadaID", temporadaID);
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