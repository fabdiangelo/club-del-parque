import DBConnection from "../../infraestructure/ports/DBConnection.js";
import Notificacion from "../../domain/entities/Notificacion.js";

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
      const admins = await this.db.getAllItems("administradores");
      admins.forEach(async (adminDoc) => {
        const admin = adminDoc.data();
        const newNotify = new Notificacion(
          id,
          'solicitud_federacion',
          `El usuario ${user.nombre} ${user.apellido} ha solicitado federarse.
          Justificante: ${justificante}`,
          new Date(),
          false,
          admin.id
        );
        await this.db.putItem("notificaciones", newNotify.toPlainObject(), id);
      });

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