export class GetPartidosByJugador {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(jugadorId) {
        return await this.partidoRepository.getPartidosPorJugador(jugadorId);
    }
}