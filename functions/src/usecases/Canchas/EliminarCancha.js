

export class EliminarCancha {
    constructor(canchaRepository) {
        this.canchaRepository = canchaRepository;
    }

    async execute(id) {
        return await this.canchaRepository.eliminarCancha(id);
    }

}