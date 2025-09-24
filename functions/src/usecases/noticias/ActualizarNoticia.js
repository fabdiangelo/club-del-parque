export default class ActualizarNoticia {
  constructor(repo) { this.repo = repo; }
  async execute(id, partial, image) { return this.repo.update(id, partial, image); }
}
