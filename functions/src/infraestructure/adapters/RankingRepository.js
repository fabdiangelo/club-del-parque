import DBConnection from "../ports/DBConnection.js";

class RankingRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "rankings";
  }

  async save(ranking) {
    const id = await this.db.putItem(this.collection, ranking, ranking.id);
    return id || ranking.id || null;
  }

  async findById(id) {
    const data = await this.db.getItemObject(this.collection, id);
    return data ? { id, ...data } : null;
  }

  async update(id, partial) {
    await this.db.updateItem(this.collection, id, partial);
    return id;
  }

  async delete(id) {
    await this.db.deleteItem(this.collection, id);
    return id;
  }

  async getAll() {
    return await this.db.getAllItemsList(this.collection);
  }

  async getByTemporada(temporadaID) {
    return await this.db.getItemsByField(this.collection, "temporadaID", temporadaID);
  }

  async getByUsuario(usuarioID) {
    return await this.db.getItemsByField(this.collection, "usuarioID", usuarioID);
  }

  async getByTemporadaYTipo(temporadaID, tipoDePartido, deporte /* optional */) {
    let rows = await this.getByTemporada(temporadaID);
    rows = rows.filter(r => String(r.tipoDePartido) === String(tipoDePartido));
    if (deporte) rows = rows.filter(r => (r.deporte || "").toLowerCase() === String(deporte).toLowerCase());
    return rows;
  }

  async getByUsuarioYTipo(usuarioID, tipoDePartido, deporte /* optional */) {
    let rows = await this.getByUsuario(usuarioID);
    rows = rows.filter(r => String(r.tipoDePartido) === String(tipoDePartido));
    if (deporte) rows = rows.filter(r => (r.deporte || "").toLowerCase() === String(deporte).toLowerCase());
    return rows;
  }

  // ← corregido para evitar falsos “no encontrado” y duplicados por deporte
  async getByUsuarioTemporadaTipo(usuarioID, temporadaID, tipoDePartido, deporte /* optional */) {
    const all = await this.getAll();
    const L = (x) => String(x ?? "").toLowerCase();

    const filtered = all.filter(
      r =>
        L(r.usuarioID) === L(usuarioID) &&
        L(r.temporadaID) === L(temporadaID) &&
        L(r.tipoDePartido) === L(tipoDePartido) &&
        (deporte ? L(r.deporte) === L(deporte) : true)
    );

    // si no hay deporte pedido, preferí filas sin deporte; si no, la primera coincidencia
    return (!deporte ? (filtered.find(r => !r.deporte) || filtered[0]) : filtered[0]) || null;
  }

  async getLeaderboard({ temporadaID, tipoDePartido, deporte /* optional */, limit = 50 } = {}) {
    let items = await this.getAll();
    if (temporadaID) items = items.filter(i => String(i.temporadaID) === String(temporadaID));
    if (tipoDePartido) items = items.filter(i => String(i.tipoDePartido) === String(tipoDePartido));
    if (deporte) items = items.filter(i => (i.deporte || "").toLowerCase() === String(deporte).toLowerCase());
    items.sort((a, b) => Number(b.puntos || 0) - Number(a.puntos || 0));
    return items.slice(0, limit);
  }

  async adjustPoints(id, delta) {
    const current = await this.db.getItemObject(this.collection, id);
    const puntos = Number(current?.puntos || 0) + Number(delta || 0);
    await this.db.updateItem(this.collection, id, { puntos });
    return id;
  }
// /functions/src/infraestructure/adapters/RankingRepository.js
async adjustCounter(id, field, delta = 1) {
  const current = await this.db.getItemObject(this.collection, id) || {};
  const next = Number(current?.[field] || 0) + Number(delta || 0);
  await this.db.updateItem(this.collection, id, { [field]: next });
  return id;
}

// Single roundtrip atomic-ish patch (read, compute, write once)
async adjustMany(id, increments = {}) {
  const current = await this.db.getItemObject(this.collection, id) || {};
  const patch = {};
  for (const [k, inc] of Object.entries(increments)) {
    if (!Number.isFinite(inc) || inc === 0) continue;
    patch[k] = Number(current?.[k] || 0) + Number(inc);
  }
  if (Object.keys(patch).length) {
    await this.db.updateItem(this.collection, id, patch);
  }
  return id;
}


}

export { RankingRepository };
