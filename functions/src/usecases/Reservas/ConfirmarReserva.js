
export class ConfirmarReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository
    }

    async execute(reservaID, usuarioId) {
        return await this.reservaRepository.confirmarReserva(reservaID, usuarioId);
    }
}