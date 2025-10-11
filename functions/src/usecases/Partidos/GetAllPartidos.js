

export class GetAllPArtidos {
    constructor(partidoRepository) {
        this.partidoRepository = partidoRepository;
    }


    async execute() {
        return await this.partidoRepository.getAll();
    }
}