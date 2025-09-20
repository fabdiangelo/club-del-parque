import DBConnection from "../infraestructure/DBConnection.js";
import AuthConnection from "../infraestructure/AuthConnection.js";

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

class AuthService {
  constructor(){
    this.db = new DBConnection();
    this.auth = new AuthConnection();
  }
    /**
   * Verifica idToken, obtiene uid y busca en Firestore en orden:
   * administradores -> federados -> usuarios
   * Devuelve objeto con role y profile (datos del documento si existe)
   */
  async verifyIdTokenAndGetProfile(idToken) {
    // Verifica token (lanza si inválido/expirado)
    try{
      const decoded = await this.auth.decodeToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email || null;

      const collectionsOrder = ["administradores", "federados", "usuarios"];
      let user = null;
      let role = "unknown";

      for (const col of collectionsOrder) {
        const snap = await this.db.getItem(col, uid);
        if (snap.exists) {
          role = col;
          user = snap.data();
          break;
        }
      }

      // Si no está en ninguna colección, devolver al menos los datos básicos
      // const authUser = await admin.auth().getUser(uid).catch(() => null);
      const payload = {
        uid,
        email,
        role,
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

export default new AuthService();