import { ReporteController } from '../controllers/ReporteController.js';
import { CrearReporte } from '../usecases/Reportes/CrearReporte.js';
import { ObtenerAllReportes } from '../usecases/Reportes/ObtenerAllReportes.js';
import { FirestoreReporteRepository } from '../infraestructure/adapters/FirestoreReporteRepository.js';

const reporteRepository = new FirestoreReporteRepository();
const crearReporteUseCase = new CrearReporte(reporteRepository);
const obtenerAllReportesUseCase = new ObtenerAllReportes(reporteRepository);
const reporteController = new ReporteController(crearReporteUseCase, obtenerAllReportesUseCase);

export { reporteController };