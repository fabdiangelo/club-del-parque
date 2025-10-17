// functions/src/infraestructure/adapters/RankingRepository.js
import DBConnection from "../ports/DBConnection.js";

class RankingRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "rankings";
  }

  /* -------------------- CRUD básicos -------------------- */

  async save(ranking) {
    // ranking.id opcional: si no hay, Firestore crea uno
    const res = await this.db.putItem(this.collection, ranking, ranking.id);
    // putItem de tu DBConnection no devuelve el id cuando usás set()
    // si necesitás el id, tendrás que pasar ranking.id o leerlo después
    return ranking.id ?? null;
  }

  async findById(id) {
    const data = await this.db.getItem(this.collection, id);
    if (!data) return null;
    return { id, ...data }; // getItem no incluye id -> lo agregamos nosotros
  }

  async update(id, partial) {
    return await this.db.updateItem(this.collection, id, partial);
  }

  async delete(id) {
    return await this.db.deleteItem(this.collection, id);
  }

  async getAll() {
    // ya devuelve [{ id, ...data }]
    return await this.db.getAllItems(this.collection);
  }

  /* -------------------- Consultas específicas -------------------- */

  async getByTemporada(temporadaID) {
    // usa el método que sí existe en DBConnection
    return await this.db.getItemsByField(this.collection, "temporadaID", temporadaID);
  }

  async getByUsuario(usuarioID) {
    return await this.db.getItemsByField(this.collection, "usuarioID", usuarioID);
  }

  async getByTemporadaYTipo(temporadaID, tipoDePartido) {
    // no hay query compuesta -> traemos por temporada y filtramos en memoria
    const rows = await this.db.getItemsByField(this.collection, "temporadaID", temporadaID);
    return rows.filter(r => String(r.tipoDePartido) === String(tipoDePartido));
  }

  async getByUsuarioYTipo(usuarioID, tipoDePartido) {
    const rows = await this.db.getItemsByField(this.collection, "usuarioID", usuarioID);
    return rows.filter(r => String(r.tipoDePartido) === String(tipoDePartido));
  }

  async getByUsuarioTemporadaTipo(usuarioID, temporadaID, tipoDePartido) {
    // sin query(), resolvemos con getAll + filtro (o 2 filtros en cascada)
    // opción 1: getAll (menos eficiente pero simple y robusto)
    const all = await this.getAll();
    return (
      all.find(
        r =>
          String(r.usuarioID) === String(usuarioID) &&
          String(r.temporadaID) === String(temporadaID) &&
          String(r.tipoDePartido) === String(tipoDePartido)
      ) || null
    );
    // Si prefieres menos carga: usa getItemsByField en cascada y filtra el resto:
    // const byUser = await this.db.getItemsByField(this.collection, "usuarioID", usuarioID);
    // return byUser.find(r => String(r.temporadaID) === String(temporadaID) && String(r.tipoDePartido) === String(tipoDePartido)) || null;
  }

  async getLeaderboard({ temporadaID, tipoDePartido, limit = 50 } = {}) {
    // sin orderBy en DBConnection -> ordenamos en memoria
    let items = await this.getAll();
    if (temporadaID) items = items.filter(i => String(i.temporadaID) === String(temporadaID));
    if (tipoDePartido) items = items.filter(i => String(i.tipoDePartido) === String(tipoDePartido));
    items.sort((a, b) => (Number(b.puntos || 0) - Number(a.puntos || 0)));
    return items.slice(0, limit);
  }

  async adjustPoints(id, delta) {
    const current = await this.db.getItem(this.collection, id);
    const puntos = Number(current?.puntos || 0) + Number(delta || 0);
    await this.db.updateItem(this.collection, id, { puntos });
    return id;
  }
}

export { RankingRepository };