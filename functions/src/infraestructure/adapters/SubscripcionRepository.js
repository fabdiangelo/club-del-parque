import DBConnection from "../ports/DBConnection.js";

export class SubscripcionRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async save(subscripcion) {
    const docRef = await this.db.putItem('subscripciones', subscripcion, subscripcion.id);
    return docRef.id || subscripcion.id;
  }

  async getItem(id){
    return this.db.getItem('subscripciones', id);
  }
}