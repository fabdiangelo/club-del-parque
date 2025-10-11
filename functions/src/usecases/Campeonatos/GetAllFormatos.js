import { FormatoCampeonatoRepository } from "../../infraestructure/adapters/FormatoCampeonatoRepository.js";

class GetAllFormatos {
  constructor() {
    this.formatoCampeonatoRepository = new FormatoCampeonatoRepository();
  }

  async execute() {
    return await this.formatoCampeonatoRepository.getAllFormatos();
  }
}

export default new GetAllFormatos();
