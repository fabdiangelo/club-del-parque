import DBConnection from "../../infraestructure/ports/DBConnection.js";

class ObtenerDatosUsuario {
  constructor(){
    this.db = new DBConnection();
  }
  async execute(uid, rol) {
    try{
      let user = null;
      if(rol){
        let collection = '';
        switch (rol){
          case 'administrador': collection = 'administradores'; break;
          case 'federado': collection = 'federados'; break;
          case 'usuario': collection = 'usuarios'; break;
        }
        if(!collection){
          throw new Error("Rol no válido")
        }

        user = await this.db.getItem(collection, uid);
      }else{
        user = await this.db.getItem('usuarios', uid);
        if(!user){
          user = await this.db.getItem('federados', uid);
          if(!user){
            user = await this.db.getItem('administradores', uid);
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