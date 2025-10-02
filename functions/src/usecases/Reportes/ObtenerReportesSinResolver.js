import { ReporteRepository } from "../../infraestructure/adapters/ReportRepository.js";

class ObtenerReportesSinResolver {
  constructor() {
    this.reporteRepository = new ReporteRepository();
  }

  async execute() {
    const reportes = await this.reporteRepository.getReportesSinResolver();
    return reportes;
  }
}

export default new ObtenerReportesSinResolver();