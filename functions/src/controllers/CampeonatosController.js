import CrearCampeonato from "../usecases/Campeonatos/CrearCampeonato.js";
import ObtenerCampeonato from "../usecases/Campeonatos/ObtenerCampeonato.js";
import ObtenerAllCampeonatos from "../usecases/Campeonatos/ObtenerAllCampeonatos.js";
import GetActualUser from "../usecases/Auth/GetActualUser.js";
import EditarCampeonato from "../usecases/Campeonatos/EditarCampeonato.js";
import ProcesarInicioCampeonato from "../usecases/Campeonatos/ProcesarInicioCampeonato.js";

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

  async getAllCampeonatos (req, res) {
    try {
      const campeonatos = await ObtenerAllCampeonatos.execute();
      return res.json(campeonatos);
    } catch (error) {
      console.error("Error in /campeonatos: ", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async editarCampeonato(req, res) {
    const { id } = req.params;
    const data = req.body;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({ error: "ID del campeonato es requerido" });
    }
    
    try {
      await EditarCampeonato.execute(id, data);
      res.json({res: 'Campeonato editado correctamente'});
    } catch (error) {
      console.error("Error al editar campeonato:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  async procesarInicio(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) return res.status(401).json({ error: "No session cookie found" });
      const user = GetActualUser.execute(sessionCookie);
      if (user.rol !== 'administrador') return res.status(403).json({ error: 'Acceso no autorizado' });

      const id = req.params.id;
      if (!id) return res.status(400).json({ error: 'ID de campeonato requerido' });

      await ProcesarInicioCampeonato.execute(id);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Error procesando inicio de campeonato:', err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  }
}

export default new CampeonatosController();
