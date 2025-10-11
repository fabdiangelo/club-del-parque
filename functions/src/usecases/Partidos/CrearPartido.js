export class CrearPartido {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(partido) {
        return await this.partidoRepository.save(partido);
    }
}