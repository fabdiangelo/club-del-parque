import { UsuarioRepository } from "../infraestructure/adapters/UsuarioRepository.js";
import { getAllUsuarios } from '../usecases/Usuarios/getAllUsuarios.js';


class UsuarioController {
    constructor() {
        this.getAllUsuariosUseCase = new getAllUsuarios(new UsuarioRepository());
    }

    async getAllUsuarios(req, res) {
        try {
            const usuarios = await this.getAllUsuariosUseCase.execute();
            console.log(usuarios);
            res.status(200).json(usuarios);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

export default new UsuarioController();