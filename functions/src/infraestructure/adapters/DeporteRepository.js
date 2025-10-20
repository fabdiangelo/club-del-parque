// functions/src/infraestructure/adapters/DeporteRepository.js
import DBConnection from "../ports/DBConnection.js";
import Deporte from "../../domain/entities/Deporte.js";

export class DeporteRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "deportes";
  }

  /** Devuelve siempre [{ id, nombre }] */
  async getAll() {
    const docs = await this.db.getAllItems(this.collection); // se espera [{id, ...data}]
    return (docs || []).map(d => ({
      id: String(d.id || "").trim().toLowerCase(),
      nombre: String(d.nombre || "").trim(),
    })).filter(d => d.id && d.nombre);
  }

  /** Devuelve { id, nombre } o null */
  async getById(id) {
    const _id = String(id || "").trim().toLowerCase();
    if (!_id) return null;
    const data = await this.db.getItem(this.collection, _id); // { nombre } | null
    if (!data) return null;
    return { id: _id, nombre: String(data.nombre || "").trim() };
  }

  /** Crea con ID “slug” estable (lowercase); si existe → error */
  async create({ id, nombre }) {
    // Validación centralizada en la entidad
    const dep = new Deporte({ id, nombre }); // lanza si inválido

    const exists = await this.getById(dep.id);
    if (exists) throw new Error(`Deporte ya existe: ${dep.id}`);

    // Guardamos sin duplicar el campo id dentro del documento
    await this.db.putItem(this.collection, { nombre: dep.nombre }, dep.id);
    return dep.toPlainObject();
  }

  /** PATCH por id: Body opcional { nombre } */
  async update(id, partial) {
    const _id = String(id || "").trim().toLowerCase();
    if (!_id) throw new Error("id inválido");

    const exists = await this.getById(_id);
    if (!exists) throw new Error(`Deporte no encontrado: ${_id}`);

    const patch = {};
    if ("nombre" in (partial || {})) {
      const nuevoNombre = String(partial.nombre || "").trim();
      if (!nuevoNombre) throw new Error("nombre obligatorio");
      // Reutilizamos la entidad para validar consistencia (manteniendo el id)
      const dep = new Deporte({ id: _id, nombre: nuevoNombre });
      patch.nombre = dep.nombre;
    }

    if (Object.keys(patch).length === 0) {
      // Nada que actualizar, devolvemos el actual
      return exists;
    }

    const out = await this.db.updateItem(this.collection, _id, patch);
    // Normalizamos salida
    const nombre = String((out?.nombre ?? patch.nombre) || exists.nombre).trim();
    return { id: _id, nombre };
  }

  /** DELETE por id */
  async delete(id) {
    const _id = String(id || "").trim().toLowerCase();
    if (!_id) throw new Error("id inválido");
    await this.db.deleteItem(this.collection, _id);
    return _id;
  }

  // Eliminado el seeding. Si en algún lado llaman a ensureDefaults, lo dejamos como no-op.
  async ensureDefaults() { /* no-op: sin semillas */ }
}

export default DeporteRepository;
