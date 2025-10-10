import CrearCampeonato from "../usecases/Campeonatos/CrearCampeonato.js";

class CampeonatosController {
  async crear(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const payload = req.body || {};
      const id = await CrearCampeonato.execute(payload);
      return res.status(200).json({ id });
    } catch (err) {
      console.error('Error creando campeonato:', err);
      return res.status(400).json({ error: err.message || String(err) });
    }
  }
}

export default new CampeonatosController();
