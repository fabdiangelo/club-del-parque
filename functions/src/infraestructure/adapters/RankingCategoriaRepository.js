// functions/src/infraestructure/adapters/RankingCategoriaRepository.js
import DBConnection from "../ports/DBConnection.js";

export class RankingCategoriaRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "rankingCategorias";
  }

  async save(doc /* plain object */) {
    // Upsert complete document by id
    const id = await this.db.putItem(this.collection, doc, doc.id);
    return id || doc.id || null;
  }

  async findById(id) {
    const data = await this.db.getItemObject(this.collection, id);
    return data ? { id, ...data } : null;
  }

  async updatePartial(id, partial) {
    // IMPORTANT: use update (merge) semantics for partial changes
    const patch = { ...partial, updatedAt: new Date().toISOString() };
    // Signature for updateItem is (collection, id, patch)
    await this.db.updateItem(this.collection, id, patch);
    return await this.findById(id);
  }

  async delete(id) {
    await this.db.deleteItem(this.collection, id);
    return id;
  }

  async getAll() {
    const list = await this.db.getAllItemsList(this.collection);
    return Array.isArray(list) ? list : [];
  }

  /**
   * Devuelve todas las categorías de un ámbito (scope)
   * @param {{temporadaID:string,deporte:string,tipoDePartido:string,filtroId?:string|null}} scope
   */
  async getByScope({ temporadaID, deporte, tipoDePartido, filtroId = null }) {
    const all = await this.getAll();
    const L = (x) => String(x ?? "").toLowerCase();
    return all
      .filter(
        (c) =>
          L(c.temporadaID) === L(temporadaID) &&
          L(c.deporte) === L(deporte) &&
          L(c.tipoDePartido) === L(tipoDePartido)
      )
      .sort(
        (a, b) => a.orden - b.orden || String(a.nombre).localeCompare(b.nombre)
      );
  }

  /**
   * Aplica un orden (por índice) sólo dentro del scope indicado.
   * Orden 0 = mejor, aumenta hacia abajo.
   * @param {{temporadaID:string,deporte:string,tipoDePartido:string,filtroId?:string|null, ids:string[]}} p
   */
  async setOrden({ temporadaID, deporte, tipoDePartido, filtroId = null, ids }) {
    if (!Array.isArray(ids)) throw new Error("ids debe ser array");

    // Leer todas las categorías del scope para validar IDs y completar faltantes
    const scopeRows = await this.getByScope({
      temporadaID,
      deporte,
      tipoDePartido,
      filtroId,
    });

    const scopeIds = scopeRows.map((r) => r.id);
    const givenSet = new Set(ids);

    // Validar que todas las ids provistas existan dentro del scope
    for (const id of ids) {
      if (!scopeIds.includes(id)) {
        throw new Error(`ID fuera de scope: ${id}`);
      }
    }

    // Agregar al final las que no vinieron en 'ids' para no perder ninguna
    const remainder = scopeIds.filter((id) => !givenSet.has(id));
    const final = [...ids, ...remainder];

    // Escribir orden secuencial (merge/patch), con marca de tiempo
    const ts = new Date().toISOString();
    const updates = final.map((id, orden) =>
      // Signature correcta: (collection, id, patch)
      this.db.updateItem(this.collection, id, { orden, updatedAt: ts })
    );
    await Promise.all(updates);

    return { ok: true, total: final.length, ids: final };
  }
}
