

export class GetAllReservas {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute() {
        return await this.reservaRepository.getAll();
    }   
}