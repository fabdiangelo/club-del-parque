import CrearCampeonato from "../usecases/Campeonatos/CrearCampeonato.js";
import ObtenerCampeonato from "../usecases/Campeonatos/ObtenerCampeonato.js";
import GetActualUser from "../usecases/Auth/GetActualUser.js";

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

  async getCampeonatoById(req, res){
    try{
      const id = req.params.id;
      if (!id) {
        return res.status(401).json({ error: "No se encontró el ID del campeonato" });
      }

      const campeonato = await ObtenerCampeonato.execute(id);

      res.status(200).json(campeonato);

    } catch (error) {
      console.error("Error in getCampeonatoById", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new CampeonatosController();
