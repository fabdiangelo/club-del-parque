import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { AdministradorRepository } from "../../infraestructure/adapters/AdministradorRepository.js";

class ObtenerDatosUsuario {
  constructor(){
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
    this.administradorRepository = new AdministradorRepository();
  }
  async execute(uid, rol) {
    try{
      let user = null;
      if(rol){
        let collection = '';
        switch (rol){
          case 'administrador': 
            collection = 'administradores'; 
            user = await this.administradorRepository.findById(uid);
            break;
          case 'federado': 
            collection = 'federados'; 
            user = await this.federadoRepository.getFederadoById(uid);
            break;
          case 'usuario': 
            collection = 'usuarios'; 
            user = await this.usuarioRepository.getUserById(uid);
            break;
        }
        if(!collection){
          throw new Error("Rol no válido");
        }
      }else{
        user = await this.administradorRepository.findById(uid);
        if(!user){
          user = await this.federadoRepository.getFederadoById(uid);
          if(!user){
            user = await this.usuarioRepository.getUserById(uid);
          }
        }
      }
      return user;
    
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new ObtenerDatosUsuario();