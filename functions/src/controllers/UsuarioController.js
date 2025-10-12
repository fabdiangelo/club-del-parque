import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

import GetActualUser from "../usecases/Auth/GetActualUser.js";
import ObtenerDatosUsuario from "../usecases/Usuarios/ObtenerDatosUsuario.js";
import ActualizarUsuario from "../usecases/Usuarios/ActualizarUsuario.js";
import GetAllUsuarios from '../usecases/Usuarios/getAllUsuarios.js';
import FederarUsuario from "../usecases/Usuarios/FederarUsuario.js";
import GetCantUsuarios from "../usecases/Usuarios/GetCantUsuarios.js";
import BloquearUsuario from "../usecases/Usuarios/BloquearUsuario.js";
import GetAllFederados from "../usecases/Usuarios/getAllFederados.js";

class UsuarioController {
  async getUserData(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }

      const userId = req.params.id;
      if (!userId) {
        return res.status(401).json({ error: "No user id found" });
      }

      const user = GetActualUser.execute(sessionCookie)
      const { uid } = user;

      if( userId !== uid && user.rol !== "administrador"){
        return res.status(401).json({ error: "Acceso no autorizado" });
      }
      console.log('user: ' + JSON.stringify(user))
      const userData = await ObtenerDatosUsuario.execute(uid, user.rol);

      console.log('user data: ' + userData)
      return res.json(userData);
    } catch (error) {
      console.error("Error in /me:", error);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  }
async getAllFederados(req, res) {
    try {

      const federados = await GetAllFederados.execute();
      return res.json(federados);
    } catch (error) {
      console.error("Error in /usuarios/federados:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllUsuarios (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const usuarios = await GetAllUsuarios.execute();
      return res.json(usuarios);
    } catch (error) {
      console.error("Error in /usuarios:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async editarUsuario (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      const userId = req.params.id;
      if( userId !== user.uid && user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const updateData = req.body;
      if(!updateData || typeof updateData !== "object"){
        return res.status(400).json({ error: "No update data provided" });
      }
      console.log('Updating user:', userId, 'with data:', updateData);
      const updatedUser = await ActualizarUsuario.execute(userId, updateData);

      // Si el usuario que se editó es el mismo que la sesión actual, reemitimos la cookie
      if (userId === user.uid) {
        // Obtener datos actualizados del usuario para incluir en el token
        const latest = await ObtenerDatosUsuario.execute(userId);
        const payload = {
          uid: userId,
          email: latest?.email || user.email || null,
          rol: latest?.rol || user.rol,
          nombre: latest?.nombre || user.nombre,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

        res.cookie("session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 2 * 60 * 60 * 1000, // 2h
        });

        // Devolver también el nuevo payload para que el cliente pueda refrescar UI si lo desea
        return res.json(updateData);
      }

      return res.json(updatedUser);
    } catch (error) {
      console.error("Error in PUT /usuario/:id:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async cantUsuarios (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const cant = await GetCantUsuarios.execute();
      return res.json(cant);
    } catch (error) {
      console.error("Error in /usuarios/cantidad:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async validarFederacion (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const idReporte = req.params.idReporte;
      if(!idReporte){
        return res.status(400).json({ error: "Falta idReporte" });
      }

      const userId = idReporte.split("-")[0];
      if(!userId){
        return res.status(400).json({ error: "idReporte inválido" });
      }

      const planId = req.body.planId;
      if(!planId){
        return res.status(400).json({ error: "Falta planId" });
      }

      const usuarioAFederar = await ObtenerDatosUsuario.execute(userId);
      if(!usuarioAFederar){
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      await FederarUsuario.execute(usuarioAFederar, planId);

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error in /usuarios/validar-federacion/:idReporte:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async negarFederacion (req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const idReporte = req.params.idReporte;
      if(!idReporte){
        return res.status(400).json({ error: "Falta idReporte" });
      }

      const userId = idReporte.split("-")[0];
      if(!userId){
        return res.status(400).json({ error: "idReporte inválido" });
      }

      const usuarioAActivar = await ObtenerDatosUsuario.execute(userId);
      if(!usuarioAActivar){
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      await ActualizarUsuario.execute(userId, {rol: usuarioAActivar.rol, estado: "activo"});

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error in /usuarios/negar-federacion/:idReporte:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  

  async bloquearUsuario(req, res) {
    try{
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "administrador"){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const usuarioId = req.params.id;
      if(!usuarioId){
        return res.status(400).json({ error: "Falta usuarioId" });
      }

      const nuevoEstado = await BloquearUsuario.execute(usuarioId);
      return res.json({ nuevoEstado });
    } catch (error) {
      console.error("Error in /usuarios/:idUsuario/bloqueo:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new UsuarioController();
