export class EditarPartido {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(partido) {
        return await this.partidoRepository.update(partido.id, partido);
    }
}