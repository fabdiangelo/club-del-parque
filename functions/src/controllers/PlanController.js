import PreCarga from "../usecases/Planes/PreCarga.js";
import GetAllPlanes from "../usecases/Planes/GetAllPlanes.js";

class PlanController {
  async precargarPlanes(req, res) {
    try {
      await PreCarga.execute();
      return res.status(200).json({ message: "Planes precargados exitosamente" });
    } catch (error) {
      console.error("Error precargando planes:", error);
      return res.status(500).json({ error: "Error precargando planes" });
    }
  }

  async getPlanes(req, res) {
    try {
      const planes = await GetAllPlanes.execute();
      return res.status(200).json(planes);
    } catch (error) {
      console.error("Error obteniendo planes:", error);
      return res.status(500).json({ error: "Error obteniendo planes" });
    }
  }
}

export default new PlanController();