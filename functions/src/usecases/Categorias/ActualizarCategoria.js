// usecases/Categorias/ActualizarCategoria.js
import Categoria from "../../domain/entities/Categoria.js";

const CAP_PERMITIDAS = new Set([4, 8, 16, 32, 64, 128, 256]);

export class ActualizarCategoria {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }

  async execute(id, partial) {
    const actual = await this.repo.getById(id);
    if (!actual) throw new Error("Categoría no encontrada");

    const nombre = (partial.nombre ?? actual.nombre);
    const capacidad = Number(partial.capacidad ?? actual.capacidad);
    const orden = Number.isInteger(partial.orden) ? partial.orden : actual.orden;

    if (!CAP_PERMITIDAS.has(capacidad)) throw new Error("Capacidad inválida (usar 4, 8, 16, 32, 64, 128, 256)");
    if (!Number.isInteger(orden) || orden < 0) throw new Error("orden debe ser entero ≥ 0");

    // valida con entidad
    const completa = new Categoria({
      id: actual.id,
      nombre,
      capacidad,
      orden,
      creadaEn: actual.creadaEn,
      actualizadaEn: actual.actualizadaEn,
    });

    const todas = await this.repo.getAll();
    const nombreEnUso = todas
      .filter(c => c.id !== id)
      .some(c => (c?.nombre || "").trim().toLowerCase() === completa.nombre.toLowerCase());
    if (nombreEnUso) throw new Error("Ya existe otra categoría con ese nombre");

    return await this.repo.updatePartial(id, completa.toPlainObject());
  }
}