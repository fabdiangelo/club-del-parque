import DBConnection from "../DBConnection";

export class TemporadaRepository {
    constructor() {
        this.db = new DBConnection();
    }

    async getAll() {
        return this.db.getAll('temporadas');
    }

    async getById(id) {
        return this.db.getItem('temporadas', id);
    }

    async save(temporada) {
        const docRef = await this.db.putItem('temporadas', temporada, temporada.id);
        return docRef.id || temporada.id;
    }

    async deleteTemporada(id) {
        return this.db.deleteItem('temporadas', id);
    }
}