import { UsuarioRepository } from '../../infraestructure/adapters/UsuarioRepository.js';

class GetAllUsuarios {
    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    async execute() {
        return await this.usuarioRepository.getAllUsers();
    }
}

export default new GetAllUsuarios;