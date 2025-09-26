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
    let userRecord;
    try {
      // Intentar crear usuario en Firebase Auth
      userRecord = await this.auth.createUser({
        email,
        password,
        displayName: nombre,
      });
    } catch (err) {
      // Si el error es que el email ya existe, obtener el usuario
      if (err.code === 'auth/email-already-exists' || err.message?.includes('already exists')) {
        userRecord = await this.auth.getUserByEmail(email);
      } else {
        throw err;
      }
    }

    // Guardar datos adicionales en Firestore si no existen
    const exists = await this.db.getItem("usuarios", userRecord.uid);
    if (!exists) {
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
    }

    const payload = {
      uid: userRecord.uid,
      email,
      rol: "usuario",
      nombre,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
    return { token, user: payload };
  }
}

export default new Register();
