import DBConnection from "../ports/DBConnection.js";

class FormatoCampeonatoRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async findById(id) {
    const item = await this.db.getItem('formatosCampeonatos', id);
    if (!item) return null;
    return { id: item.id, ...item };
  }

  async save(formato) {
    const docRef = await this.db.putItem('formatosCampeonatos', formato, formato.id);
    return docRef.id;
  }

  async getAllFormatos() {
    const snapshot = await this.db.getAllItems('formatosCampeonatos');
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export { FormatoCampeonatoRepository };
