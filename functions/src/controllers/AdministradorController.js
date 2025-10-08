import CrearAdministrador from "../usecases/Administrador/CrearAdministrador.js";

class AdministradorController {
  async crearAdministrador(req, res) {
    try {
      const administradorData = req.body;
      const { token, user } = await CrearAdministrador.execute(administradorData);
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true en prod (https)
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000, // 2h
      });
      
      return res.status(201).json(user);
    } catch (error) {
      console.error("Error al crear administrador:", error);
      res.status(500).json({ error: "Error al crear administrador" });
    }
  }
}

export default new AdministradorController();