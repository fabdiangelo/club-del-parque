export default class CrearNoticia {
  constructor(repo) { this.repo = repo; }
  async execute(noticia, image) { return this.repo.create(noticia, image); }
}
