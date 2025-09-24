export default class EliminarImagenNoticia {
  constructor(repo) { this.repo = repo; }
  async execute(id) { return this.repo.removeImage(id); }
}
