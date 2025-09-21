import GetActualUser from "../usecases/Auth/GetActualUser.js";
import ObtenerDatosUsuario from "../usecases/Usuarios/ObtenerDatosUsuario.js";

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
}

export default new UserController();
