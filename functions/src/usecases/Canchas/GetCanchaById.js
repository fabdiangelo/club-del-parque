

export class GetCanchaById {
    constructor(canchaRepository) {
        this.canchaRepository = canchaRepository;
    }

    async execute(id) {
        console.log("Ejecutando GetCanchaById con id:", id);
        return await this.canchaRepository.getById(id);
    }
}