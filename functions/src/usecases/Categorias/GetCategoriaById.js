// usecases/Categorias/GetCategoriaById.js
export class GetCategoriaById {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }
  async execute(id) {
    return await this.repo.getById(id);
  }
}
