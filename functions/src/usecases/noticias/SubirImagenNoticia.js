export default class SubirImagenNoticia {
  constructor(repo) { this.repo = repo; }
  async execute(id, image) { return this.repo.setImage(id, image); }
}