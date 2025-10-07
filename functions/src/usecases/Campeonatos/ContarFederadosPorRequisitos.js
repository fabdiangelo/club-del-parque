import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

function computeAgeFromBirth(birthIso) {
  try {
    const b = new Date(birthIso);
    if (Number.isNaN(b.getTime())) return null;
    const diff = Date.now() - b.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return age;
  } catch (e) {
    return null;
  }
}

class ContarFederadosPorRequisitos {
  constructor() {
    this.repo = new FederadoRepository();
  }

  async execute({ genero, edadMin, edadMax }) {
    // Normalize params: prefer edadDesde/edadHasta (or edadMin/edadMax) and support string numbers
    const params = { genero };
    // Accept multiple naming conventions
    const edDesde = typeof arguments[0].edadDesde !== 'undefined' ? arguments[0].edadDesde : edadMin;
    const edHasta = typeof arguments[0].edadHasta !== 'undefined' ? arguments[0].edadHasta : edadMax;
    params.edadDesde = (edDesde === '' || typeof edDesde === 'undefined' || edDesde === null) ? null : Number(edDesde);
    params.edadHasta = (edHasta === '' || typeof edHasta === 'undefined' || edHasta === null) ? null : Number(edHasta);

    const all = await this.repo.getAllFederados();
    let filtered = all;
    if (params.genero && params.genero !== 'ambos') {
      filtered = filtered.filter(f => (f.genero || '').toLowerCase() === (params.genero || '').toLowerCase());
    }
    if (typeof params.edadDesde === 'number' || typeof params.edadHasta === 'number') {
      filtered = filtered.filter(f => {
        let age = null;
        if (typeof f.edad === 'number') age = f.edad;
        else if (f.nacimiento) age = computeAgeFromBirth(f.nacimiento);
        if (age === null || typeof age !== 'number' || Number.isNaN(age)) return false;
        if (typeof params.edadDesde === 'number' && age < params.edadDesde) return false;
        if (typeof params.edadHasta === 'number' && age > params.edadHasta) return false;
        return true;
      });
    }
    return filtered.length;
  }
}

export default new ContarFederadosPorRequisitos();
