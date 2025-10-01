

export class getAllUsuarios {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    async execute() {
        return await this.usuarioRepository.getAllUsers();
    }

    
}