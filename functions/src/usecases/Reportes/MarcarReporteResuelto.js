// usecases/Reportes/MarcarReporteResuelto.js
import { ReporteRepository } from "../../infraestructure/adapters/ReportRepository.js";

class MarcarReporteResuelto {
  constructor() {
    this.reporteRepository = new ReporteRepository();
  }
  async execute(idReporte) {
    if (!idReporte) throw new Error("Reporte no encontrado");

    const reporte = await this.reporteRepository.findById(idReporte);
    if (!reporte) throw new Error("Reporte no encontrado");

    // toggle (o fija en 'resuelto' si preferís)
    const nextEstado =
      reporte.estado === "resuelto" ? "pendiente" : "resuelto";

    const updated = await this.reporteRepository.update(idReporte, {
      estado: nextEstado,
      leido: true,
      actualizadoEn: new Date().toISOString(),
      ...(nextEstado === "resuelto"
        ? { resueltoEn: new Date().toISOString() }
        : {}),
    });

    return updated;
  }
}

export default new MarcarReporteResuelto();
