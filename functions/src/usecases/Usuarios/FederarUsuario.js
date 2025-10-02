import Plan from "../../domain/entities/Plan.js";
import Usuario from "../../domain/entities/Usuario.js";
import Federado from "../../domain/entities/Federado.js";
import { ReporteRepository } from "../../infraestructure/adapters/ReportRepository.js";
import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

class FederarUsuario {
  constructor(){
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
    this.reporteRepository = new ReporteRepository();
  }

  async execute(usuario) {
    try {
      if(!usuario){
        throw new Error("Usuario inválido");
      }
      let fechaInicio = new Date().toISOString();
      if(usuario instanceof Usuario){
        const recuperarFederado = await this.federadoRepository.getFederadoById(usuario.id);
        if(recuperarFederado){
          const estaFederado = recuperarFederado.planes && recuperarFederado.planes[0].fechaFin > new Date();
          if(estaFederado){
            fechaInicio = recuperarFederado.planes[0].fechaFin.toISOString();
          }
        }
      }else if(usuario instanceof Federado){
        const estaFederado = usuario.planes && usuario.planes[0].fechaFin > new Date();
        if(estaFederado){
          fechaInicio = usuario.planes[0].fechaFin.toISOString();
        }
      }else{
        throw new Error("Tipo de usuario inválido");
      }

      const planBasico = new Plan(
        "Plan Básico", 
        1, 
      );
      
      const federado = new Federado(
        usuario.id, 
        usuario.nombre, 
        usuario.apellido, 
        usuario.email, 
        usuario.telefono, 
        [planBasico], 
        usuario.fotoURL
      );
      
      await this.federadoRepository.save(federado);

    } catch (err){
      console.error("Error federando usuario:", err);
      throw err;
    }
  }
}

export default new FederarUsuario();