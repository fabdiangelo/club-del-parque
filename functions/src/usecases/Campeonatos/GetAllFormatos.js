import { FormatoCampeonatoRepository } from "../../infraestructure/adapters/FormatoCampeonatoRepository.js";

class GetAllFormatos {
  constructor() {
    this.repo = new FormatoCampeonatoRepository();
  }

  async execute() {
    return await this.repo.getAllFormatos();
  }
}

export default new GetAllFormatos();
