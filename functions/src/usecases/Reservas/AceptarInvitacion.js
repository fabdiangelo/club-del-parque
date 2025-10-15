

export class AceptarInvitacion {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaID, jugadorID) {
        await this.reservaRepository.aceptarInvitacion(reservaID, jugadorID);
    }
}