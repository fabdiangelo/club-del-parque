

export class DeshabilitarReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaId) {
        return this.reservaRepository.deshabilitarReserva(reservaId);
    }
}
