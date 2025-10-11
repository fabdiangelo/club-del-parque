export class EditarPartido {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(id, partidoData) {
        return await this.partidoRepository.update(id, partidoData);
    }
}