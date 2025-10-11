export class GetPartidosPorTemporada {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(temporadaId) {
        return await this.partidoRepository.getPartidosPorTemporada(temporadaId);
    }
}