export class GetPartidoPorId {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }

    async execute(id) {
        return await this.partidoRepository.getById(id);
    }
}