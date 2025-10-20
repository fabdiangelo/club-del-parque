// Permite cualquier string no vacío (sin catálogo fijo)
export default class Genero {
  constructor(nombre) {
    const n = String(nombre || "").trim().toLowerCase();
    if (!n) throw new Error("Género obligatorio");
    this.nombre = n;
  }
  toPlainObject() { return { nombre: this.nombre }; }
}
