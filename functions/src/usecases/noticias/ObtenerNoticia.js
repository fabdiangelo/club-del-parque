export default class ObtenerNoticia {
  constructor(repo) { this.repo = repo; }
  async execute(id) { return this.repo.findById(id); }
}
