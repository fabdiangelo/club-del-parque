import AuthService from "../services/AuthService.js";

class AuthController{
  async loginWithPassword(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: "idToken required" });
      
      const { token, user } = await AuthService.verifyIdTokenAndGetProfile(idToken);
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true en prod (https)
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000, // 2h
      });

      return res.status(200).json({user});
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
      
      const { token, user } = await AuthService.verifyIdTokenAndGetProfile(idToken);

      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true en prod (https)
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000, // 2h
      });

      return res.status(200).json({user});
    } catch (err) {
      console.error("auth verify error:", err);
      // Detalle de error minimal para el cliente
      return res.status(401).json({ error: err.message || "Unauthorized" });
    }
  }
}

export default new AuthController();