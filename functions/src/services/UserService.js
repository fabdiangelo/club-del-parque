import Registrado from "../domain/entities/Registrado.js";
import admin from "firebase-admin";

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

class UserService {
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

    await db.collection("usuarios").doc(userRecord.uid).set(userData.toPlainObject());

    return userData;
  }
}

export default new UserService();
