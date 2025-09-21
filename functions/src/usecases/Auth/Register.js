import Registrado from "../../domain/entities/Registrado.js";
import DBConnection from "../../infraestructure/ports/DBConnection.js";
import AuthConnection from "../../infraestructure/ports/AuthConnection.js";

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

class Register {
  constructor(){
    this.db = new DBConnection();
    this.auth = new AuthConnection();
  }

  async execute(email, password, nombre, apellido, estado, nacimiento, genero) {
    // Crear usuario en Firebase Auth
    const userRecord = await this.auth.createUser({
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

    const payload = {
      uid: userRecord.uid,
      email,
      rol: "usuario",
      nombre,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    await this.db.putItem("usuarios", userData.toPlainObject(), userRecord.uid);

    return { token, user: payload };
  }
}

export default new Register();
