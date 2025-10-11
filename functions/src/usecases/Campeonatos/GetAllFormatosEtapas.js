import { FormatoEtapaRepository } from "../../infraestructure/adapters/FormatoEtapaRepository.js";

class GetAllFormatosEtapas {
  constructor() {
    this.formatoEtapaRepository = new FormatoEtapaRepository();
  }

  async execute() {
    return await this.formatoEtapaRepository.getAll();
  }
}

export default new GetAllFormatosEtapas();
