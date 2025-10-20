// usecases/Categorias/GetAllCategorias.js
export class GetAllCategorias {
  constructor(categoriaRepository) {
    this.repo = categoriaRepository;
  }
  async execute() {
    return await this.repo.getAll();
  }
}
