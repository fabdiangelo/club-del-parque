// usecases/Categorias/CrearCategoria.js
import Categoria from "../../domain/entities/Categoria.js";

const CAP_PERMITIDAS = new Set([4, 8, 16, 32, 64, 128, 256]);

export class CrearCategoria {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }

  async execute({ nombre, capacidad }) {
    const cap = Number(capacidad);
    if (!CAP_PERMITIDAS.has(cap)) throw new Error("Capacidad inválida (usar 4, 8, 16, 32, 64, 128, 256)");

    const existentes = await this.repo.getAll();
    // por defecto, nueva va al final (orden = length)
    const nueva = new Categoria({ nombre, capacidad: cap, orden: existentes.length });

    // nombre único (opcional)
    const existe = existentes.some(c => (c?.nombre || "").trim().toLowerCase() === nueva.nombre.toLowerCase());
    if (existe) throw new Error("Ya existe una categoría con ese nombre");

    const id = await this.repo.save(nueva.toPlainObject());
    return id;
  }
}
