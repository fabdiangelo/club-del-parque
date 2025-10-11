import DBConnection from "../ports/DBConnection.js";

class EtapaRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async save(etapa) {
    const docRef = await this.db.putItem('etapas', etapa, etapa.id);
    return docRef.id;
  }

  async findById(id) {
    const item = await this.db.getItem('etapas', id);
    if (!item) return null;
    return { id: item.id, ...item };
  }

  async getAll() {
    const snapshot = await this.db.getAllItems('etapas');
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export { EtapaRepository };
