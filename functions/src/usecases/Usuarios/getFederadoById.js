import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

class getFederadoById {
  constructor() {
    this.federadoRepository = new FederadoRepository();
  }

  async execute(id) {
    return await this.federadoRepository.getFederadoById(id);
  }
}

export default new getFederadoById();