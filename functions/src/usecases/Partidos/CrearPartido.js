export class CrearPartido {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    async execute(partido) {
        return await this.usuarioRepository.save(partido);
    }
}