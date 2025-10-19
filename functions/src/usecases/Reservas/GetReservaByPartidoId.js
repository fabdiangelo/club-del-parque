

export class GetReservaByPartido {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(partidoId) {
        return await this.reservaRepository.getReservaByPartidoId(partidoId);
    }
}