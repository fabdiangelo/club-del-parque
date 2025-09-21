export class ObtenerAllReportes {
    constructor(reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    async execute() {
        return await this.reporteRepository.findAll();
    }
}