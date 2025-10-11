import DBConnection from "../ports/DBConnection.js";

class FormatoEtapaRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async findById(id) {
    const item = await this.db.getItem('formatosEtapas', id);
    if (!item) return null;
    return { id: item.id, ...item };
  }

  async save(formatoEtapa) {
    const docRef = await this.db.putItem('formatosEtapas', formatoEtapa, formatoEtapa.id);
    return docRef.id;
  }

  async getAll() {
    return await this.db.getAllItems('formatosEtapas');
  }
}

export { FormatoEtapaRepository };
