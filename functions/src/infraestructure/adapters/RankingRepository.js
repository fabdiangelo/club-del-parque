import DBConnection from "../ports/DBConnection.js";

class RankingRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "rankings";
  }

  async save(ranking) {
    return await this.db.putItem(this.collection, ranking, ranking.id);
  }

  async findById(id) {
    return await this.db.getItemObject(this.collection, id);
  }

  async update(id, partial) {
    return await this.db.updateItem(this.collection, id, partial);
  }

  async delete(id) {
    return await this.db.deleteItem(this.collection, id);
  }

  async getAll() {
    return await this.db.getAllItemsList(this.collection);
  }

  async getByTemporada(temporadaID) {
    const { items } = await this.db.getByField(this.collection, "temporadaID", "==", temporadaID);
    return items;
  }

  async getByUsuario(usuarioID) {
    const { items } = await this.db.getByField(this.collection, "usuarioID", "==", usuarioID);
    return items;
  }

  async getByTemporadaYTipo(temporadaID, tipoDePartido) {
    const { items } = await this.db.query(this.collection, {
      where: [
        ["temporadaID", "==", temporadaID],
        ["tipoDePartido", "==", tipoDePartido],
      ],
    });
    return items;
  }

  async getByUsuarioYTipo(usuarioID, tipoDePartido) {
    const { items } = await this.db.query(this.collection, {
      where: [
        ["usuarioID", "==", usuarioID],
        ["tipoDePartido", "==", tipoDePartido],
      ],
    });
    return items;
  }

  async getLeaderboard({ temporadaID, tipoDePartido, limit = 50 } = {}) {
    const where = [];
    if (temporadaID) where.push(["temporadaID", "==", temporadaID]);
    if (tipoDePartido) where.push(["tipoDePartido", "==", tipoDePartido]);

    const { items } = await this.db.query(this.collection, {
      where: where.length ? where : undefined,
      orderBy: [["puntos", "desc"]],
      limit,
    });
    return items;
  }

  async adjustPoints(id, delta) {
    await this.db.updateItem(this.collection, id, { puntos: this.db.increment(delta) });
    return id;
  }async getByUsuarioTemporadaTipo(usuarioID, temporadaID, tipoDePartido) {
    const { items } = await this.db.query(this.collection, {
      where: [
        ["usuarioID", "==", usuarioID],
        ["temporadaID", "==", temporadaID],
        ["tipoDePartido", "==", tipoDePartido],
      ],
      limit: 1,
    });
    return items?.[0] || null;
  }

  async adjustPoints(id, delta) {
    await this.db.updateItem(this.collection, id, { puntos: this.db.increment(delta) });
    return id;
  }
}

export { RankingRepository };