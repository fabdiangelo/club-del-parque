import CrearAdministrador from "../usecases/Administrador/CrearAdministrador.js";

class AdministradorController {
  async crearAdministrador(req, res) {
    try {
      const administradorData = req.body;
      const administradorId = await CrearAdministrador.execute(administradorData);
      res.status(201).json({ administradorId });
    } catch (error) {
      console.error("Error al crear administrador:", error);
      res.status(500).json({ error: "Error al crear administrador" });
    }
  }
}

export default new AdministradorController();