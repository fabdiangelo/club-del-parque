// usecases/Categorias/EliminarCategoria.js
export class EliminarCategoria {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }
  async execute(id) {
    await this.repo.delete(id);
    return id;
  }
}
