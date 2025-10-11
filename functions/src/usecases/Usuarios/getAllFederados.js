import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

class GetAllFederados {
  constructor() {
    this.federadoRepository = new FederadoRepository();
  }

  async execute() {
    return await this.federadoRepository.getAllFederados();
  }
}

export default new GetAllFederados();
