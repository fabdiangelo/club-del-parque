import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";



export class agregarNotiToken {
    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }


    async execute(usuarioID, token) {
        if (!usuarioID) {
            throw new Error("UsuarioID es requerido");
        }

        return await this.usuarioRepository.agregarNotiToken(usuarioID, token);
    }
}