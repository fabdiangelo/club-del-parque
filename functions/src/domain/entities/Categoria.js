// domain/Categoria.js
export default class Categoria {
  constructor({ id = null, nombre, capacidad, orden = 0, creadaEn = null, actualizadaEn = null }) {
    if (!nombre || typeof nombre !== "string") throw new Error("nombre obligatorio");
    if (!Number.isInteger(capacidad) || capacidad < 4) throw new Error("capacidad debe ser entero ≥ 4");
    if (!Number.isInteger(orden) || orden < 0) throw new Error("orden debe ser entero ≥ 0");

    this.id = id;
    this.nombre = nombre.trim();
    this.capacidad = capacidad;
    this.orden = orden; // 0 = más alta
    this.creadaEn = creadaEn || new Date().toISOString();
    this.actualizadaEn = actualizadaEn || new Date().toISOString();
  }

  toPlainObject() {
    return {
      id: this.id,
      nombre: this.nombre,
      capacidad: this.capacidad,
      orden: this.orden,
      creadaEn: this.creadaEn,
      actualizadaEn: this.actualizadaEn,
    };
  }
}
