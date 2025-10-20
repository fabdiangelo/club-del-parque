// usecases/Categorias/ReordenarCategorias.js
export class ReordenarCategorias {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }

  /**
   * @param {string[]} orderedIds array de ids en el orden de mayor a menor (top → bottom)
   * Asigna orden = índice del array.
   */
  async execute(orderedIds) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new Error("orderedIds debe ser un array no vacío");
    }
    const actuales = await this.repo.getAll();
    const idsSet = new Set(actuales.map(c => c.id));
    for (const id of orderedIds) {
      if (!idsSet.has(id)) throw new Error(`ID inválido en orderedIds: ${id}`);
    }
    // Todos, no sólo los que vinieron en el array (por si falta alguno)
    const allIds = actuales.map(c => c.id);
    const finalOrder = allIds.map((id) => {
      const idx = orderedIds.indexOf(id);
      return { id, orden: idx >= 0 ? idx : orderedIds.length }; // los ausentes al final
    });
    await this.repo.applyOrder(finalOrder);
    return true;
  }
}
