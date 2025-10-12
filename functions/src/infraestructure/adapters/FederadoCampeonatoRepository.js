import DBConnection from "../ports/DBConnection.js";

class FederadoCampeonatoRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "federado-campeonato";
  }

  getFederadoCampeonatoById(userId) {
    return this.db.getItem(this.collection, userId);
  }

  async getAllFederados() {
    return await this.db.getAllItems(this.collection);
  }

  async save(federadoCampeonato) {
    const docRef = await this.db.putItem(this.collection, federadoCampeonato, federadoCampeonato.id);
    return docRef.id || federadoCampeonato.id;
  }

  async update(id, federadoCampeonato) {
    return this.db.updateItem(this.collection, id, federadoCampeonato);
  }
}

export { FederadoCampeonatoRepository };
