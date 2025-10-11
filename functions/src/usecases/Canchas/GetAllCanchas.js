

export class GetAllCanchas {
    constructor(canchaRepository) {
        this.canchaRepository = canchaRepository;
    }

    async execute() {
        return await this.canchaRepository.getAll();
    }
}