import GetActualUser from "../usecases/Auth/GetActualUser.js";
import ObtenerDatosUsuario from "../usecases/Usuarios/ObtenerDatosUsuario.js";
import GetAllUsuarios from '../usecases/Usuarios/GetAllUsuarios.js';

class UsuarioController {
  async getUserData(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }

      const userId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "No user id found" });
      }

      // Verificar la cookie
      const user = GetActualUser.execute(sessionCookie)
      const { uid } = user;

      if( userId !== uid && user.rol !== "administrador"){
        return res.status(401).json({ error: "Acceso no autorizado" });
      }
      
      const userData = await ObtenerDatosUsuario.execute(uid, user.rol);

      console.log(userData)
      return res.json(userData);
    } catch (error) {
      console.error("Error in /me:", error);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  }

  async getAllUsuarios (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const usuarios = await GetAllUsuarios.execute();
      return res.json(usuarios);
    } catch (error) {
      console.error("Error in /usuarios:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async cantUsuarios (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const usuarios = await GetAllUsuarios.execute();
      return res.json({cantidad: usuarios.length});
    } catch (error) {
      console.error("Error in /usuarios/cantidad:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  
}

export default new UsuarioController();
