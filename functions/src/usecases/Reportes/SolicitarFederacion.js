import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { ReporteRepository } from "../../infraestructure/adapters/ReportRepository.js";
import Reporte from "../../domain/entities/Reporte.js";

class SolicitarFederacion {
  constructor(){
    this.reporteRepository = new ReporteRepository();
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
  }
  async execute(user, justificante) {
    try{
      if(!user){
        throw new Error("Usuario no válido")
      }
      let motivo = `El usuario ${user.nombre} ${user.apellido} ha solicitado federarse. Es su primera vez federándose`;

      if(user.rol == "federado"){
        if(user.validoHasta){
          motivo = `El federado ${user.nombre} ${user.apellido} ha solicitado una renovacion a su federacion. Su federación actual tiene como fecha límite ${user.validoHasta}`;
        } else {
          motivo = `El federado ${user.nombre} ${user.apellido} ha solicitado una renovacion a su federacion. No se ha encontrado ninguna federacion anterior para este usuario`;
        }
      }

      const id = user.id + '-solicitud_federacion-' + new Date().toISOString();
      // Create a notify for aech administrator
      const newReport = new Reporte(
        id,
        motivo,
        justificante,
        new Date().toISOString(),
        'pendiente',
        user.email,
        false,
        'solicitud_federacion'
      );
      await this.reporteRepository.save(newReport.toPlainObject())

      // Return user data
      const estado = "federacion_pendiente";
      console.log("user: ", user)
      console.log("id: ", user.id)
      console.log("rol: ", user.rol)
      await this.usuarioRepository.update(user.id, {estado: estado})

      if(user.rol == "federado"){
        await this.federadoRepository.update(user.id, {estado: estado})
      }
      
      return { message: "Solicitud de federación enviada correctamente" };
    
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new SolicitarFederacion();