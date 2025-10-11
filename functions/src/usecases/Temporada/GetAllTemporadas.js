

export default class GetAllTemporadas {
    constructor(temporadaRepository) {
        this.temporadaRepository = temporadaRepository;
    }

    async execute() {
        return await this.temporadaRepository.getAll();
    }

}