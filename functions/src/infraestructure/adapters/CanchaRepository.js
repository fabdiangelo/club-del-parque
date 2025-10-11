import DBConnection from "../ports/DBConnection.js";

export class CanchaRepository {
    constructor() {
        this.db = new DBConnection();
    }


    async getAll() {
        return this.db.getAllItems('canchas').then(docs => docs);
    }

    async getById(id) {
        return this.db.getItem('canchas', id).then(doc => doc.data());
    }

    async save(cancha) {
        console.log("Saving cancha:", cancha);
        const docRef = await this.db.putItem('canchas', cancha, cancha.id);
        return docRef.id || cancha.id;
    }

    async eliminarCancha(id) {

        try {

            await this.db.deleteItem('canchas', id);
            return id;
        } catch(error) {
            throw error;
        }
    }

        
}