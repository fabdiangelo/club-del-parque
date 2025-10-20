// functions/src/domain/entities/Deporte.js
export default class Deporte {
  constructor({ id, nombre }) {
    if (!id || typeof id !== "string") throw new Error("id obligatorio");
    if (!/^[a-z0-9-]{2,40}$/.test(id)) {
      throw new Error("id inválido (slug: a-z, 0-9, guión)");
    }
    if (!nombre || typeof nombre !== "string") throw new Error("nombre obligatorio");

    this.id = id.trim().toLowerCase();
    this.nombre = nombre.trim();
  }

  toPlainObject() {
    return { id: this.id, nombre: this.nombre };
  }
}
