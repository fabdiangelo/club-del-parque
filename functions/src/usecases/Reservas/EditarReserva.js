

export class EditarReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(id, reservaData) {
        return await this.reservaRepository.update(id, reservaData);
    }
}