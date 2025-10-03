import DBConnection from "../DBConnection.js";

export class AdministradorRepository {
  constructor() {
    this.dbConnection = new DBConnection();
    this.collectionName = 'administradores';
  }

  async save(administrador) {
    const docRef = await this.dbConnection.putItem(this.collectionName, administrador);
    return docRef.id;
  }

  async findById(id) {
    const administrador = await this.dbConnection.getItem(this.collectionName, id);
    if (!administrador) {
      return null;
    }
    return { id: administrador.id, ...administrador};
  }

  async update(id, administrador) {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.set(administrador, { merge: true });
  }
}
