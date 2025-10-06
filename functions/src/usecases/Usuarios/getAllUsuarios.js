import { UsuarioRepository } from '../../infraestructure/adapters/UsuarioRepository.js';
import { FederadoRepository } from '../../infraestructure/adapters/FederadoRepository.js';
import { AdministradorRepository } from '../../infraestructure/adapters/AdministradorRepository.js';

class GetAllUsuarios {
    constructor() {
        this.usuarioRepository = new UsuarioRepository();
        this.federadoRepository = new FederadoRepository();
        this.administradorRepository = new AdministradorRepository();
    }

    async execute() {
        const users = await this.usuarioRepository.getOnlyUsers();
        const federados = await this.federadoRepository.getAllFederados();
        const admins = await this.administradorRepository.getAll();
        return [...admins, ...federados, ...users];
    }
}

export default new GetAllUsuarios;