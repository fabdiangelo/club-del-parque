

export class GetTemporadaById {
    constructor(temporadaRepository) {
        this.temporadaRepository = temporadaRepository;
    }

    async execute(id) {
        return await this.temporadaRepository.getById(id);
    }
}