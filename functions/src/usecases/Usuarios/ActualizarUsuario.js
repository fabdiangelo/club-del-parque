import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { AdministradorRepository } from "../../infraestructure/adapters/AdministradorRepository.js";

class ActualizarUsuario {
  constructor(){
    this.usuarioRepo = new UsuarioRepository();
    this.federadoRepo = new FederadoRepository();
    this.adminRepo = new AdministradorRepository();
  }

  async execute(uid, data) {
    try{
      if(data.rol && !["usuario", "federado", "administrador"].includes(data.rol)){
        throw new Error("Rol inválido");
      }

      if(data.rol === "usuario" || data.rol === "federado"){
        await this.usuarioRepo.update(uid, data);
      }

      if(data.rol === "federado"){
        await this.federadoRepo.update(uid, data);
      }

      if(data.rol === "administrador"){
        await this.adminRepo.update(uid, data);
      }
      
      return data;
    } catch (err){
      console.error("Error updating user:", err);
      throw err;
    }
  }
}

export default new ActualizarUsuario();