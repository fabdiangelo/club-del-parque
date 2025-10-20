import DBConnection from "../ports/DBConnection.js";
import Filtros from "../../domain/entities/Filtros.js";

export default class FiltrosRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "filtros";
  }

  async getAll() {
    const docs = await this.db.getAllItems(this.collection); // devuelve [{id, ...data}]
    return (docs || []).map(d => ({
      id: d.id,
      modalidad: { nombre: d.modalidad }, // shape que espera la UI
      genero: { nombre: d.genero },
      edadMin: d.edadMin ?? null,
      edadMax: d.edadMax ?? null,
      pesoMin: d.pesoMin ?? null,
      pesoMax: d.pesoMax ?? null,
    }));
  }

  async getById(id) {
    const data = await this.db.getItem(this.collection, String(id));
    if (!data) return null;
    return {
      id: String(id),
      modalidad: { nombre: data.modalidad },
      genero: { nombre: data.genero },
      edadMin: data.edadMin ?? null,
      edadMax: data.edadMax ?? null,
      pesoMin: data.pesoMin ?? null,
      pesoMax: data.pesoMax ?? null,
    };
  }

  async create(payload) {
    // valida con entidad de dominio
    const filtro = new Filtros(payload).toPlainObject();
    const doc = {
      modalidad: filtro.modalidad.nombre,
      genero: filtro.genero.nombre,
      edadMin: filtro.edadMin,
      edadMax: filtro.edadMax,
      pesoMin: filtro.pesoMin,
      pesoMax: filtro.pesoMax,
    };
    const saved = await this.db.putItem(this.collection, doc); // dejas que Firestore asigne id
    const id = saved?.id || saved || doc.id; // según tu DBConnection
    return await this.getById(id);
  }

  async update(id, payload) {
    // valida con entidad (permite dejar valores en null)
    const filtro = new Filtros(payload).toPlainObject();
    const patch = {
      modalidad: filtro.modalidad.nombre,
      genero: filtro.genero.nombre,
      edadMin: filtro.edadMin,
      edadMax: filtro.edadMax,
      pesoMin: filtro.pesoMin,
      pesoMax: filtro.pesoMax,
    };
    await this.db.updateItem(this.collection, String(id), patch);
    return await this.getById(id);
  }

  async delete(id) {
    await this.db.deleteItem(this.collection, String(id));
    return { ok: true };
  }
}
