import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import Campeonato from "../../domain/entities/Campeonato.js";

class CrearCampeonato {
  constructor() {
    this.repo = new CampeonatoRepository();
  }

  async execute(payload) {
    // Basic validation
    if (!payload || !payload.nombre) throw new Error('Nombre requerido');
    const id = payload.id || `${payload.nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Date.now()}`;
  const requisitos = payload.requisitosParticipacion || { genero: 'ambos', edadDesde: null, edadHasta: null, rankingDesde: null, rankingHasta: null };
  const dobles = typeof payload.dobles !== 'undefined' ? payload.dobles : false;
  const c = new Campeonato(id, payload.nombre, payload.descripcion || '', payload.inicio || null, payload.fin || null, payload.ultimaPosicionJugable || 1, payload.formatoCampeonatoID || null, requisitos, dobles);
    await this.repo.save(c.toPlainObject());
    return id;
  }
}

export default new CrearCampeonato();
