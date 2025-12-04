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
    await this.db.updateItem(this.collection, id, { ...partial, updatedAt: new Date().toISOString() });
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

  async getByFiltroId(filtroId) {
    return await this.db.getItemsByField(this.collection, "filtroId", String(filtroId));
  }

  async getByTemporadaYTipo(temporadaID, tipoDePartido, deporte /* optional */, filtroId /* optional */) {
    let rows = await this.getByTemporada(temporadaID);
    // Normaliza tipoDePartido a 'singles' o 'dobles'
    const normTipo = normalizeTipoDePartido(tipoDePartido);
    rows = rows.filter(r => normalizeTipoDePartido(r.tipoDePartido) === normTipo);
    if (deporte) rows = rows.filter(r => (r.deporte || "").toLowerCase() === String(deporte).toLowerCase());
    if (filtroId != null) rows = rows.filter(r => String(r.filtroId || "") === String(filtroId));
    return rows;
  }

  async getByUsuarioYTipo(usuarioID, tipoDePartido, deporte /* optional */, filtroId /* optional */) {
    let rows = await this.getByUsuario(usuarioID);
    const normTipo = normalizeTipoDePartido(tipoDePartido);
    rows = rows.filter(r => normalizeTipoDePartido(r.tipoDePartido) === normTipo);
    if (deporte) rows = rows.filter(r => (r.deporte || "").toLowerCase() === String(deporte).toLowerCase());
    if (filtroId != null) rows = rows.filter(r => String(r.filtroId || "") === String(filtroId));
    return rows;
  }

  // evita falsos “no encontrado” y dupes por deporte/filtro
  async getByUsuarioTemporadaTipo(usuarioID, temporadaID, tipoDePartido, deporte /* optional */, filtroId /* optional */) {
    const all = await this.getAll();
    const L = (x) => String(x ?? "").toLowerCase();

    const normTipo = normalizeTipoDePartido(tipoDePartido);
    const filtered = all.filter(
      r =>
        L(r.usuarioID) === L(usuarioID) &&
        L(r.temporadaID) === L(temporadaID) &&
        normalizeTipoDePartido(r.tipoDePartido) === normTipo &&
        (deporte ? L(r.deporte) === L(deporte) : true) &&
        (filtroId != null ? String(r.filtroId || "") === String(filtroId) : true)
    );
// Normaliza tipoDePartido a 'singles' o 'dobles'
function normalizeTipoDePartido(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t === "singles" || t === "single") return "singles";
  if (t === "dobles" || t === "double" || t === "doubles" || t === "doble") return "dobles";
  // Si viene eliminacion/roundRobin, usar el campo de modalidad/género si está disponible, o fallback a null
  if (t === "eliminacion" || t === "roundrobin") return null;
  return t;
}

    // preferí filas sin deporte/filtro cuando no se pasen explícitamente
    const prefer = filtered.find(r => (!deporte ? !r.deporte : true) && (filtroId == null ? !r.filtroId : true));
    return (prefer || filtered[0]) || null;
  }

  async getLeaderboard({ temporadaID, tipoDePartido, deporte /* opt */, filtroId /* opt */, genero /* opt: objeto */ , limit = 50 } = {}) {
    let items = await this.getAll();
    const s = (v) => (v == null ? "" : String(v));
    if (temporadaID) items = items.filter(i => s(i.temporadaID) === s(temporadaID));
    if (tipoDePartido) items = items.filter(i => s(i.tipoDePartido) === s(tipoDePartido));
    if (deporte) items = items.filter(i => (i.deporte || "").toLowerCase() === s(deporte).toLowerCase());
    if (filtroId != null) items = items.filter(i => s(i.filtroId) === s(filtroId));
    if (genero) items =  items = items.filter(i => (i.genero || "").toLowerCase() === genero.toLowerCase());
    items.sort((a, b) => Number(b.puntos || 0) - Number(a.puntos || 0));
    return items.slice(0, limit);
  }

  matchByFiltros(item, filtros) {
    // compara contra snapshot si existe, si no, ignora
    const snap = item?.filtrosSnapshot || null;
    if (!snap) return false; // si pediste filtros, exigimos snapshot
    const S = (x) => String(x ?? "").toLowerCase();

    if (filtros.modalidad?.nombre && S(snap.modalidad?.nombre) !== S(filtros.modalidad.nombre)) return false;
    if (filtros.genero?.nombre && S(snap.genero?.nombre) !== S(filtros.genero.nombre)) return false;

    const numOrNull = (v) => (v === null || v === undefined ? null : Number(v));
    const eMin = numOrNull(filtros.edadMin);
    const eMax = numOrNull(filtros.edadMax);
    const pMin = numOrNull(filtros.pesoMin);
    const pMax = numOrNull(filtros.pesoMax);

    // si el filtro pide rangos, el snap debe estar dentro
    if (eMin != null && numOrNull(snap.edadMin) != null && numOrNull(snap.edadMin) < eMin) return false;
    if (eMax != null && numOrNull(snap.edadMax) != null && numOrNull(snap.edadMax) > eMax) return false;
    if (pMin != null && numOrNull(snap.pesoMin) != null && numOrNull(snap.pesoMin) < pMin) return false;
    if (pMax != null && numOrNull(snap.pesoMax) != null && numOrNull(snap.pesoMax) > pMax) return false;

    return true;
  }

  async adjustPoints(id, delta) {
    const current = await this.db.getItemObject(this.collection, id);
    const puntos = Number(current?.puntos || 0) + Number(delta || 0);
    await this.db.updateItem(this.collection, id, { puntos, updatedAt: new Date().toISOString() });
    return id;
  }

  async adjustCounter(id, field, delta = 1) {
    const current = await this.db.getItemObject(this.collection, id) || {};
    const next = Number(current?.[field] || 0) + Number(delta || 0);
    await this.db.updateItem(this.collection, id, { [field]: next, updatedAt: new Date().toISOString() });
    return id;
  }

  async adjustMany(id, increments = {}) {
    const current = await this.db.getItemObject(this.collection, id) || {};
    const patch = {};
    for (const [k, inc] of Object.entries(increments)) {
      if (!Number.isFinite(inc) || inc === 0) continue;
      patch[k] = Number(current?.[k] || 0) + Number(inc);
    }
    if (Object.keys(patch).length) {
      patch.updatedAt = new Date().toISOString();
      await this.db.updateItem(this.collection, id, patch);
    }
    return id;
  }
}

export { RankingRepository };
