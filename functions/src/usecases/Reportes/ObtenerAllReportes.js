export class ObtenerAllReportes {
    constructor(reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    async execute() {
        const reportes = await this.reporteRepository.findAll();
        for (let reporte of reportes) {
            if(!reporte.leido){
                reporte.leido = false;
                this.reporteRepository.leido(reporte.id);
            }
        }
        return reportes;
    }
}