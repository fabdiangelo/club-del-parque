import { FormatoEtapaRepository } from "../../infraestructure/adapters/FormatoEtapaRepository.js";

class SaveFormatoEtapa {
  constructor() {
    this.formatoEtapaRepository = new FormatoEtapaRepository();
  }

  async execute(payload) {
    return await this.formatoEtapaRepository.save(payload);
  }
}

export default new SaveFormatoEtapa();
