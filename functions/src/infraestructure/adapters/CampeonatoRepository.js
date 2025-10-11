import DBConnection from "../ports/DBConnection.js";

class CampeonatoRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async save(campeonato) {
    const docRef = await this.db.putItem('campeonatos', campeonato, campeonato.id);
    return docRef.id;
  }

  async findById(id) {
    const item = await this.db.getItem('campeonatos', id);
    if (!item) return null;
    return { id: item.id, ...item };
  }

  async getAll() {
    const snapshot = await this.db.getAllItems('campeonatos');
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export { CampeonatoRepository };
