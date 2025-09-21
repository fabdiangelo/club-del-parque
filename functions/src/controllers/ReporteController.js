import { ReporteRepository } from '../infraestructure/adapters/ReportRepository.js';

import {CrearReporte} from '../usecases/Reportes/CrearReporte.js'
import {ObtenerAllReportes} from '../usecases/Reportes/ObtenerAllReportes.js'


class ReporteController {
    constructor() {
        this.crearReporteUseCase = new CrearReporte(new ReporteRepository());
        this.obtenerAllReportes = new ObtenerAllReportes(new ReporteRepository());
    }

    async crearReporte(req, res) {
        try {
            const { motivo, descripcion, fecha, estado, idUsuario, leido } = req.body;
            
            // Validaciones básicas
            if (!motivo || !descripcion) {
                return res.status(400).json({ error: "Motivo y descripción son requeridos" });
            }

            const reporte = { 
                motivo, 
                descripcion, 
                fecha: fecha || new Date().toISOString(), 
                estado: estado || 'pendiente', 
                idUsuario, 
                leido: leido || false 
            };
            
            const resultado = await this.crearReporteUseCase.execute(reporte);
            res.status(201).json(resultado);
        } catch (error) {
            console.error("Error al crear reporte:", error);
            res.status(500).json({ error: "Error al crear reporte" });
        }
    }

    async obtenerReportes(req, res) {
        try {
            const reportes = await this.obtenerAllReportes.execute();
            res.status(200).json(reportes);
        } catch (error) {
            console.error("Error al obtener reportes:", error);
            res.status(500).json({ error: "Error al obtener reportes" });
        }
    }
}

export default new ReporteController();