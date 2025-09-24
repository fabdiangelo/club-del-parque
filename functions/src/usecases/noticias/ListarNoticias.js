export default class ListarNoticias {
  constructor(repo) { this.repo = repo; }
  async execute({ limit, orderBy } = {}) { return this.repo.findAll({ limit, orderBy }); }
}
