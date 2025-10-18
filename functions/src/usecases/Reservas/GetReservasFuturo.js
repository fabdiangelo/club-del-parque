

export class GetReservasFuturo {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute() {
        return await this.reservaRepository.getReservasFuturo();
    }
}