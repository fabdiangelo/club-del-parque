

export class RechazarReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaID) {
        return await this.reservaRepository.rechazarReserva(reservaID);
    }
}