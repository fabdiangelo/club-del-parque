// usecases/Categorias/ResolverCategoriaDePosicion.js
import { resolverCategoriaPorPosicion } from "../../domain/services/ResolverCategoriaPorPosicion.js";

export class ResolverCategoriaDePosicion {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }

  async execute(posicion) {
    const categorias = await this.repo.getAll();
    const resultado = resolverCategoriaPorPosicion(posicion, categorias.map(c => ({
      ...c,
      contienePosicion: (p) => p >= c.rangoMin && p <= c.rangoMax
    })));
    return resultado;
  }
}
