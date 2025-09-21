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
  async execute(idToken) {
    // Verifica token (lanza si inválido/expirado)
    try{
      const decoded = await this.auth.decodeToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email || null;
      const rol = decoded.rol;

      let collection = '';
      switch (rol){
        case 'administrador': collection = 'administradores'; break;
        case 'federado': collection = 'federados'; break;
        case 'usuario': collection = 'usuarios'; break;
      }
      let user = await this.db.getItem(col, uid).data();

      const payload = {
        uid,
        email,
        rol,
        nombre: user.nombre,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
      
      return { token, user: payload };
    
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new Login();