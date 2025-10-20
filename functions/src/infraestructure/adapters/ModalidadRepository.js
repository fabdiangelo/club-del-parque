import DBConnection from "../ports/DBConnection.js";

export default class ModalidadRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "modalidades";
  }

  async getAll() {
    const docs = await this.db.getAllItems(this.collection);
    // Normalizamos a { nombre }
    return (docs || []).map(d => ({ nombre: String(d?.nombre || "").trim().toLowerCase() }))
                      .filter(d => d.nombre);
  }

  async create(nombre) {
    const n = String(nombre || "").trim().toLowerCase();
    if (!n) throw new Error("nombre obligatorio");
    const id = n; // usamos el nombre como id estable
    const exists = await this.db.getItem(this.collection, id);
    if (exists) throw new Error(`Modalidad ya existe: ${n}`);
    await this.db.putItem(this.collection, { nombre: n }, id);
    return { nombre: n };
  }

  async delete(nombre) {
    const id = String(nombre || "").trim().toLowerCase();
    if (!id) throw new Error("nombre obligatorio");
    await this.db.deleteItem(this.collection, id);
    return { ok: true };
  }
}
