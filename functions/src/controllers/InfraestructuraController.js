import GetActualUser from "../usecases/Auth/GetActualUser.js";

import ObtenerMetricas from "../usecases/Infraestructura/ObtenerMetricas.js";

class InfraestructuraController {
  async obtenerMetricas(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }

      // Verificar la cookie
      const user = GetActualUser.execute(sessionCookie)

      if(user.rol !== "administrador"){
        return res.status(401).json({ error: "Acceso no autorizado" });
      }
      const metricas = await ObtenerMetricas.execute();
      res.status(200).json(metricas);
    } catch (error) {
      console.error("Error al obtener métricas:", error);
      res.status(500).json({ error: "Error al obtener métricas" });
    }
  }
}

export default new InfraestructuraController();