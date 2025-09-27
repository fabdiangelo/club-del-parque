import GetActualUser from "../usecases/Auth/GetActualUser.js";
import ObtenerDatosUsuario from "../usecases/Usuarios/ObtenerDatosUsuario.js";
import SolicitarFederacion from "../usecases/Usuarios/SolicitarFederacion.js";

class UserController {
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

      if( userId !== uid && user.rol !== "Administrador"){
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

  async solicitarFederarUsuario(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const userId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "No user id found" });
      }
      const { justificante } = req.body;
      if (!justificante) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      const msg = await SolicitarFederacion.execute(userId, justificante);
      return res.json(msg);
    } catch (error) {
      console.error("Error al enviar solicitud de federacion", error);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  }
}

export default new UserController();
