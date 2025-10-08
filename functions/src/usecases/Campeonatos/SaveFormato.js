import { FormatoCampeonatoRepository } from "../../infraestructure/adapters/FormatoCampeonatoRepository.js";

class SaveFormato {
  constructor() {
    this.repo = new FormatoCampeonatoRepository();
  }

  async execute(formato) {
    // Expect formato.id provided
    if (!formato || !formato.id) throw new Error('Formato id requerido');
    await this.repo.save(formato);
    return formato.id;
  }
}

export default new SaveFormato();
