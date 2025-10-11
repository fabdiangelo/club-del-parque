

export class EliminarPartido {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(id) {
        return await this.partidoRepository.delete(id);
    }
}