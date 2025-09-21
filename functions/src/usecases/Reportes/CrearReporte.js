export class CrearReporte {

    constructor(reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    async execute(reporte) {
        return await this.reporteRepository.save(reporte);
    }
}