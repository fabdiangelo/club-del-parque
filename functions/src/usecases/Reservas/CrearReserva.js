

export class CrearReserva {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaData) {
        return await this.reservaRepository.create(reservaData);
    }
}   