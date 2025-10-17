
export class ConfirmarReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository
    }

    async execute(reservaID) {
        return await this.reservaRepository.confirmarReserva(reservaID);
    }
}