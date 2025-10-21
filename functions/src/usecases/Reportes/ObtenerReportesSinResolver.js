import { ReporteRepository } from "../../infraestructure/adapters/ReportRepository.js";
class ObtenerReportesSinResolver {
  constructor(repo = new ReporteRepository()) { this.repo = repo; }
  async execute() {

    return await this.repo.getReportesSinResolver();
  }
}
export default new ObtenerReportesSinResolver();
