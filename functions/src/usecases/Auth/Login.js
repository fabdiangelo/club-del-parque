import DBConnection from "../../infraestructure/ports/DBConnection.js";
import AuthConnection from "../../infraestructure/ports/AuthConnection.js";

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

class Login {
  constructor(){
    this.db = new DBConnection();
    this.auth = new AuthConnection();
  }
    /**
   * Verifica idToken, obtiene uid y busca en Firestore en orden:
   * administradores -> federados -> usuarios
   * Devuelve objeto con role y profile (datos del documento si existe)
   */
  async execute(idToken, conGoogle = false) {
    // Verifica token (lanza si inválido/expirado)
    try{
      const decoded = await this.auth.decodeToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email || null;
      console.log(decoded)
      let rol = decoded.rol;

      // Solo permitir login si el usuario existe en la base de datos
      let user = null;
      let collection = '';
      if (!rol) {
        // Buscar en usuarios por defecto si no hay rol
        let allData = await this.db.getItem("usuarios", uid);
        if (!allData) {
          allData = await this.db.getItem("administradores", uid);
        }
        if(allData.estado == "inactivo"){
          throw new Error("Este usuario se encuentra bloqueado. Consulte con un administrador si considera que es un error.");
        }
        if (!allData) {
          throw new Error("No existe una cuenta previa para este usuario");
        }
        rol = allData.rol;
        await this.auth.setRole(uid, rol);
      }

      switch (rol) {
        case 'administrador': collection = 'administradores'; break;
        case 'federado': collection = 'federados'; break;
        case 'usuario': collection = 'usuarios'; break;
      }
      if (!collection) {
        throw new Error("El usuario no tiene un rol asignado");
      }
      user = await this.db.getItem(collection, uid);
      if (!user) {
        throw new Error("No existe una cuenta previa para este usuario");
      }
      if(user.estado == "inactivo"){
        throw new Error("Este usuario se encuentra bloqueado. Consulte con un administrador si considera que es un error.");
      }
      console.log(user);
      const payload = {
        uid,
        email,
        rol,
        nombre: user.nombre,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
      return { token, user: payload };
    } catch (err) {
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new Login();