export class ReporteController {
    constructor(crearReporteUseCase, obtenerAllReportesUseCase) {
        this.crearReporteUseCase = crearReporteUseCase;
        this.obtenerAllReportesUseCase = obtenerAllReportesUseCase;
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
            const reportes = await this.obtenerAllReportesUseCase.execute();
            res.status(200).json(reportes);
        } catch (error) {
            console.error("Error al obtener reportes:", error);
            res.status(500).json({ error: "Error al obtener reportes" });
        }
    }
}