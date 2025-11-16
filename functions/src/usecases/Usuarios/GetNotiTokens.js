import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";

export class  GetNotiToken {
    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }
    async execute(usuarioID) {
        if (!usuarioID) {
            throw new Error("UsuarioID es requerido");
        }

        return await this.usuarioRepository.getNotiTokensById(usuarioID);
    }
}