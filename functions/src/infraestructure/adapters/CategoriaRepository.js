import DBConnection from "../ports/DBConnection.js";

export class CategoriaRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "rankingCategorias";
  }

  /** Always return top-level id and numeric orden */
  async getAll() {
    // Your DBConnection.getAllItems ALREADY emits { id: doc.id, ...data }
    const docs = await this.db.getAllItems(this.collection);
    return (docs || []).map((c, i) => ({
      ...c,
      id: c.id, // ensure top-level id exists
      orden: Number.isInteger(c?.orden) ? c.orden : i,
      capacidad: Number(c?.capacidad ?? 0),
    }));
  }

  async getById(id) {
    const data = await this.db.getItem(this.collection, id);
    return data ? { id, ...data } : null;
  }

  /**
   * Create or update.
   * - On create: we add the doc, then immediately PATCH the doc to include its "id" field,
   *   so the frontend ALWAYS receives top-level id from getAll/getById.
   */
  async save(categoria) {
    const now = new Date().toISOString();
    const obj = { ...categoria, actualizadaEn: now };
    const hasId = Boolean(categoria?.id);

    if (hasId) {
      await this.db.putItem(this.collection, obj, categoria.id);
      return categoria.id;
    }

    // create
    const ref = await this.db.putItem(this.collection, obj, null);
    const newId = ref?.id || ref; // handle both DocumentReference or string
    // write back the id inside the document (defensive, helps when other readers don't keep top-level id)
    await this.db.updateItem(this.collection, newId, { id: newId, creadaEn: now });
    return newId;
  }

  async delete(id) {
    await this.db.deleteItem(this.collection, id);
    return id;
  }

  async updatePartial(id, partial) {
    const now = new Date().toISOString();
    const out = await this.db.updateItem(this.collection, id, { ...partial, actualizadaEn: now });
    // Make sure caller always gets the id
    return { id, ...(out || partial), actualizadaEn: now };
  }

  /**
   * Bulk apply order.
   * @param {{id:string, orden:number}[]} pairs
   */
  async applyOrder(pairs) {
    for (const { id, orden } of pairs) {
      await this.updatePartial(id, { orden });
    }
    return true;
  }
}
export default CategoriaRepository;
