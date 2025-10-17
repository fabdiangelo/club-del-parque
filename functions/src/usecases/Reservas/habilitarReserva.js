

export class habilitarReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaId) {
        return this.reservaRepository.habilitarReserva(reservaId);
    } 
}