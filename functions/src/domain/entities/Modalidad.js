// Permite cualquier string no vacío (sin catálogo fijo)
export default class Modalidad {
  constructor(nombre) {
    const n = String(nombre || "").trim().toLowerCase();
    if (!n) throw new Error("Modalidad obligatoria");
    this.nombre = n;
  }
  toPlainObject() { return { nombre: this.nombre }; }
}
