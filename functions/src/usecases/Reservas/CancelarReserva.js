

export class CancelarReserva {
    construtor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaID, usuarioId) {
        return await this.reservaRepository.cancelarReserva(reservaID, usuarioId);
    }

}