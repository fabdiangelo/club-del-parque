import Usuario from "../../domain/entities/Usuario.js";
import Federado from "../../domain/entities/Federado.js";
import Subscripcion from "../../domain/entities/Subscripcion.js";
import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { PlanRepository } from "../../infraestructure/adapters/PlanRepository.js";
import { SubscripcionRepository } from "../../infraestructure/adapters/SubscripcionRepository.js";

class FederarUsuario {
  constructor(){
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
    this.planRepository = new PlanRepository();
    this.subscripcionRepository = new SubscripcionRepository();
  }

  async execute(usuario, planId) {
    try {
      if(!usuario){
        throw new Error("Usuario inválido");
      }
      let fechaInicio = new Date();
      console.log("Usuario a federar:", usuario);
      let federado = null;
      if(usuario.rol === "usuario"){
        federado = await this.federadoRepository.getFederadoById(usuario.id);
        if(federado){
          const estaFederado = federado.subscripcionesIDs && federado.subscripcionesIDs[0];
          if(estaFederado){
            const ultSub = await this.subscripcionRepository.getItem(federado.subscripcionesIDs[0]);
            if(ultSub && new Date (ultSub.fechaFin) > new Date()){
              fechaInicio = new Date(ultSub.fechaFin);
            }
          }
        }else{
          federado = new Federado(
            usuario.id, 
            usuario.email, 
            usuario.nombre,
            usuario.apellido, 
            "activo",
            usuario.nacimiento, 
            usuario.genero
          );
          
          await this.federadoRepository.save(federado.toPlainObject());
        }
      }else if(usuario.rol === "federado"){
        federado = await this.federadoRepository.getFederadoById(usuario.id);
        if(!federado){
          throw new Error("No se encontró el federado asociado al usuario");
        }
        const estaFederado = federado.subscripcionesIDs && federado.subscripcionesIDs[0];
        if(estaFederado){
          const ultSub = await this.subscripcionRepository.getItem(federado.subscripcionesIDs[0]);
          if(ultSub && new Date(ultSub.fechaFin) > new Date()){
            fechaInicio = new Date(ultSub.fechaFin);
          }
        }
      }else{
        throw new Error("Tipo de usuario inválido");
      }

      const plan = await this.planRepository.findById(planId);
      if(!plan){
        throw new Error("Plan no encontrado");
      }

      const nuevaSubscripcion = new Subscripcion(
        new Date().toISOString() + '-' + usuario.id + '-' + plan.id, 
        fechaInicio.toISOString(), 
        new Date(fechaInicio.setMonth(fechaInicio.getMonth() + plan.frecuenciaRenovacion)).toISOString(),
        usuario.id,
        plan.id
      );

      const subId = await this.subscripcionRepository.save(nuevaSubscripcion.toPlainObject());

      // await this.federadoRepository.agregarSubscripcion(usuario.id, subId);

      await this.usuarioRepository.update(usuario.id, {
        ...usuario,
        rol: "federado",
        estado: "activo"
      });

      await this.federadoRepository.update(federado.id, {
        ...federado,
        subscripcionesIDs: [subId, ...federado.subscripcionesIDs],
        estado: "activo",
        validoHasta: nuevaSubscripcion.fechaFin,
        rol: "federado"
      });

      

    } catch (err){
      console.error("Error federando usuario:", err);
      throw err;
    }
  }
}

export default new FederarUsuario();