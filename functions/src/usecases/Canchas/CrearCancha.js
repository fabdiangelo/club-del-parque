

export class CrearCancha {
    constructor(canchaRepository) {
        this.canchaRepository = canchaRepository;
    }

    async execute(cancha) {
        console.log("Ejecutando CrearCancha con datos:", cancha);
        return await this.canchaRepository.save(cancha);
    }
}