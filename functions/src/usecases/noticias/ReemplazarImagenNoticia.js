export default class ReemplazarImagenNoticia {
  constructor(repo) { this.repo = repo; }
  async execute(id, image) { return this.repo.setImage(id, image); }
}