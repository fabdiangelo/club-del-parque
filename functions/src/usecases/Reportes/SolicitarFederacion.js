import DBConnection from "../../infraestructure/ports/DBConnection.js";
import Reporte from "../../domain/entities/Reporte.js";

class SolicitarFederacion {
  constructor(){
    this.db = new DBConnection();
  }
  async execute(uid, justificante) {
    try{
      let user = await this.db.getItem("usuarios", uid);
      console.log(user)
      const id = user.id + '-solicitud_federacion-' + new Date().toISOString();
      // Create a notify for aech administrator
      const newReport = new Reporte(
        id,
        `El usuario ${user.nombre} ${user.apellido} ha solicitado federarse`,
        justificante,
        new Date().toISOString(),
        'pendiente',
        user.email,
        false,
        'solicitud_federacion'
      );
      await this.db.putItem("reportes", newReport.toPlainObject(), id);

      // Return user data
      user.estado = "pendiente de federacion";
      await this.db.putItem("usuarios", user, uid);
      
      return { message: "Solicitud de federación enviada correctamente" };
    
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new SolicitarFederacion();