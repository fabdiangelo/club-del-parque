import { FormatoEtapaRepository } from "../../infraestructure/adapters/FormatoEtapaRepository.js";

class SaveFormatoEtapa {
  constructor() {
    this.repo = new FormatoEtapaRepository();
  }

  async execute(payload) {
    if (!payload) throw new Error('Payload required');
    if (!payload.id) throw new Error('ID required for formato etapa');
    // minimal validation
    const obj = {
      id: payload.id,
      tipoEtapa: payload.tipoEtapa || payload.tipo || 'etapa',
      descripcion: payload.descripcion || '',
    };
    await this.repo.save(obj);
    return obj.id;
  }
}

export default new SaveFormatoEtapa();
