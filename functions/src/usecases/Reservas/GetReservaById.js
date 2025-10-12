

export class GetReservaById {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(reservaID) {
        return await this.reservaRepository.getById(reservaID);
    }
}