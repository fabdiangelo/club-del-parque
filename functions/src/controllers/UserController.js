import userService from "../services/UserService.js"

class UserController {
  async register(req, res) {
    try {
      const { email, password, nombre, apellido, estado, nacimiento, genero } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
      }

      const newUser = await userService.registerUser(email, password, nombre, apellido, estado, nacimiento, genero);
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Error en registro:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();
