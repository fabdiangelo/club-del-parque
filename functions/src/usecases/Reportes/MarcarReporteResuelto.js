import { ReporteRepository } from "../../infraestructure/adapters/ReportRepository.js";

class MarcarReporteResuelto {
  constructor() {
    this.reporteRepository = new ReporteRepository();
  }
  async execute(idReporte) {
    const reporte = await this.reporteRepository.findById(idReporte);
    if (!reporte) {
      throw new Error("Reporte no encontrado");
    }
    let estado = '';
    reporte.estado == 'resuelto' ? estado = 'pendiente' : estado = "resuelto";
    await this.reporteRepository.update(idReporte, estado);
    return reporte;
  }
}

export default new MarcarReporteResuelto();