// functions/src/usecases/Usuarios/CambiarCategoriaFederado.js
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { CategoriaRepository } from "../../infraestructure/adapters/CategoriaRepository.js";

class CambiarCategoriaFederado {
  constructor() {
    this.federadoRepo = new FederadoRepository();
    this.categoriaRepo = new CategoriaRepository();
  }

  /**
   * @param {string} federadoId
   * @param {string|null} categoriaId
   * - Si categoriaId es null, borra la categoría del federado.
   * - Si viene string, valida que la categoría exista.
   */
  async execute(federadoId, categoriaId) {
    if (!federadoId) throw new Error("federadoId obligatorio");

    // permitir null (quitar categoría)
    if (categoriaId !== null && typeof categoriaId !== "string") {
      throw new Error("categoriaId debe ser string o null");
    }

    // Validación de existencia si no es null
    if (categoriaId) {
      const cat = await this.categoriaRepo.getById(categoriaId);
      if (!cat) throw new Error("Categoría no encontrada");
    }

    const out = await this.federadoRepo.setCategoria(federadoId, categoriaId);
    return { id: out.id, categoriaId: out.categoriaId ?? null };
  }
}

export default new CambiarCategoriaFederado();
