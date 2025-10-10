
export class CrearTemporada {
    constructor(temporadaRepository) {
        this.temporadaRepository = temporadaRepository;
    }

    async execute(temporada) {
        return await this.temporadaRepository.save(temporada);
    }
}