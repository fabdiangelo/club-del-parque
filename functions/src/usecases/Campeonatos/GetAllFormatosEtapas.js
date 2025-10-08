import { FormatoEtapaRepository } from "../../infraestructure/adapters/FormatoEtapaRepository.js";

class GetAllFormatosEtapas {
  constructor() {
    this.repo = new FormatoEtapaRepository();
  }

  async execute() {
    return await this.repo.getAll();
  }
}

export default new GetAllFormatosEtapas();
