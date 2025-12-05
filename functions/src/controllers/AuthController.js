import Login from "../usecases/Auth/Login.js";
import Register from "../usecases/Auth/Register.js";
import GetActualUser from "../usecases/Auth/GetActualUser.js";

class AuthController {
  async loginWithPassword(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: "idToken required" });

      const { token, user } = await Login.execute(idToken);
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 2 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json({ user });
    } catch (err) {
      console.error("auth verify error:", err);
      // Detalle de error minimal para el cliente
      return res.status(401).json({ error: err.message || "Unauthorized" });
    }
  }

  async loginWithGoogle(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: "idToken required" });

      const { token, user } = await Login.execute(idToken);

      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true en prod (https)
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 2 * 60 * 60 * 1000, // 2h
        path: "/",
      });

      return res.status(200).json({ user });
    } catch (err) {
      console.error("auth verify error:", err);
      // Detalle de error minimal para el cliente
      return res.status(401).json({ error: err.message || "Unauthorized" });
    }
  }

  async register(req, res) {
    try {
      const { email, password, nombre, apellido, estado, nacimiento, genero } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son requeridos" });
      }

      const { token, user } = await Register.execute(email, password, nombre, apellido, estado, nacimiento, genero);

      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true en prod (https)
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 2 * 60 * 60 * 1000, // 2h
        path: "/",
      });

      return res.status(201).json(user);
    } catch (error) {
      console.error("Error en registro:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async getActualUser(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }

      // Verificar la cookie
      const user = GetActualUser.execute(sessionCookie)
      const { uid, email, rol, nombre } = user;

      console.log(user)
      console.log(nombre)
      return res.json({ uid, email, rol, nombre });
    } catch (error) {
      console.error("Error in /me:", error);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  }

  logout(req, res) {
    res.clearCookie("session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // MUY IMPORTANTE
    });

    return res.status(200).json({ message: "Logout successful" });
  }
}

export default new AuthController();