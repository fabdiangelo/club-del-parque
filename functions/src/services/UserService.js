import Registrado from "../domain/entities/Registrado.js";
import DBConnection from "../infraestructure/DBConnection.js";

class UserService {
  constructor(){
    this.db = new DBConnection();
  }

  async registerUser(email, password, nombre, apellido, estado, nacimiento, genero) {
    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre,
    });

    // Guardar datos adicionales en Firestore
    const userData = new Registrado( 
      userRecord.uid,
      email,
      nombre,
      apellido,
      estado,
      nacimiento,
      genero
    );

    await this.db.putItem("usuarios", userData.toPlainObject(), userRecord.uid);

    return userData;
  }
}

export default new UserService();
