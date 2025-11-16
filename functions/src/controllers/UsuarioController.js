import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

import CambiarCategoriaFederado from "../usecases/Usuarios/CambiarCategoriaFederado.js";
import GetActualUser from "../usecases/Auth/GetActualUser.js";
import ObtenerDatosUsuario from "../usecases/Usuarios/ObtenerDatosUsuario.js";
import ActualizarUsuario from "../usecases/Usuarios/ActualizarUsuario.js";
import GetAllUsuarios from '../usecases/Usuarios/getAllUsuarios.js';
import FederarUsuario from "../usecases/Usuarios/FederarUsuario.js";
import GetCantUsuarios from "../usecases/Usuarios/GetCantUsuarios.js";
import BloquearUsuario from "../usecases/Usuarios/BloquearUsuario.js";
import GetAllFederados from "../usecases/Usuarios/getAllFederados.js";
import EnsureRankingForFederado from "../usecases/Rankings/EnsureRankingForFederado.js";

import PrecargaFederados from "../usecases/Usuarios/PrecargaFederados.js";
import getFederadoById from "../usecases/Usuarios/getFederadoById.js";
import { agregarNotiToken } from "../usecases/Usuarios/AgregarNotiToken.js";
import { GetNotiToken } from "../usecases/Usuarios/GetNotiTokens.js";
import DBConnection from "../infraestructure/ports/DBConnection.js";
import admin from "firebase-admin";
import { enviarNotificacion } from "../infraestructure/ports/PushNotification.js";

class UsuarioController {

  async probarnoti(req, res) {
    const db = new DBConnection();
    console.log("entrnado aca");

    const usuarios = await db.getAllItems("usuarios");
    for(const u of usuarios) {


      if(u.notiTokens == null || u.notiTokens.length == 0) {
        continue;
      }
      await enviarNotificacion(u.notiTokens, "Titulo de prueba", "Mensaje de prueba", "https://google.com");
    }

    res.json({ ok: true });
  }

  async GetNotiToken(req, res) {
    try {
      

      const {uid, token} = req.body;

      const tokens = await new GetNotiToken().execute(uid);
      return res.json(tokens);

    } catch(error) {
      console.error("Error in /usuarios/noti-tokens:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }


  async agregarNotiToken(req, res) {
    try {


      const { uid, token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const result = await new agregarNotiToken().execute(uid, token);
      return res.json(result);
    } catch (error) {
      console.error("Error in /me:", error);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  }

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

      console.log('user: ' + JSON.stringify(user))
      console.log('userID: ' + JSON.stringify(userId))
      
      if( userId == uid || user.rol == "administrador"){
        const userData = await ObtenerDatosUsuario.execute(userId);
        return res.json(userData);
      }
      const userData = await ObtenerDatosUsuario.execute(userId);

      return res.json({id: userData.id, nombre: userData.nombre, email: userData.email});
    } catch (error) {
      console.error("Error in /me:", error);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  }
async cambiarCategoriaFederado(req, res) {
  try {
    const sessionCookie = req.cookies.session || "";
    if (!sessionCookie) {
      return res.status(401).json({ error: "No session cookie found" });
    }
    const user = GetActualUser.execute(sessionCookie);
    if (user.rol !== "administrador") {
      return res.status(403).json({ error: "Acceso no autorizado" });
    }

    const { id } = req.params; // federadoId
    if (!id) return res.status(400).json({ error: "Falta id del federado" });

    // Scope and target category come in the body:
    const {
      categoriaId,      // required to assign; can be null to clear, but then ranking default points = 0
      temporadaID,      // required to build the scope
      deporte,          // "tenis" | "padel" | null
      tipoDePartido,    // "singles" | "dobles"  (required)
      filtroId = null,  // FK only
    } = req.body ?? {};

    if (!temporadaID || !tipoDePartido) {
      return res.status(400).json({ error: "Faltan temporadaID o tipoDePartido" });
    }

    // This guarantees a ranking row exists (or is updated) **right now**
    const ranking = await EnsureRankingForFederado.execute({
      federadoId: id,
      temporadaID,
      deporte,
      tipoDePartido,
      filtroId,
      categoriaId: categoriaId ?? null,
    });

    // Respond with the (new/updated) ranking so the UI can refresh instantly
    return res.json({ ok: true, ranking });
  } catch (error) {
    console.error("Error in PATCH /federados/:id/categoria:", error);
    return res.status(400).json({ error: error?.message || "Bad Request" });
  }
}
  async getFederadoById(req, res) {

    const {id} = req.params;
    try {
      const federado = await getFederadoById.execute(id);
      if(!federado){
        return res.status(404).json({ error: "Federado no encontrado" });
      }

      return res.json(federado);
    } catch(error) {
      console.error("Error in /federados/:id:", error);
      return res.status(500).json({ error: "Internal Server Error" });
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
async cambiarCategoriaFederado(req, res) {
  try {
    const sessionCookie = req.cookies.session || "";
    if (!sessionCookie) return res.status(401).json({ error: "No session cookie found" });
    const user = GetActualUser.execute(sessionCookie);
    if (user.rol !== "administrador") return res.status(403).json({ error: "Acceso no autorizado" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Falta id del federado" });

    const { categoriaId, temporadaID, deporte, tipoDePartido, filtroId = null } = req.body ?? {};

    // 1) Asignamos categoría al federado (dato “maestro”)
    const result = await CambiarCategoriaFederado.execute(id, categoriaId ?? null);

    // 2) Si hay scope → aseguramos ranking y aplicamos puntos por defecto “top de la de abajo”
    if (temporadaID && tipoDePartido) {
      await EnsureRankingForFederado.execute({
        federadoId: id,
        temporadaID,
        deporte,
        tipoDePartido,
        filtroId,
        categoriaId: categoriaId ?? null,
      });
    }

    return res.json(result);
  } catch (error) {
    console.error("Error in PATCH /federados/:id/categoria:", error);
    return res.status(400).json({ error: error?.message || "Bad Request" });
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
// functions/src/controllers/UsuarioController.js  (inside class)
async cambiarCategoriaFederado(req, res) {
  try {
    const sessionCookie = req.cookies.session || "";
    if (!sessionCookie) return res.status(401).json({ error: "No session cookie found" });
    const user = GetActualUser.execute(sessionCookie);
    if (user.rol !== "administrador") return res.status(403).json({ error: "Acceso no autorizado" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Falta id del federado" });

    const {
      categoriaId,            // puede ser ID de /categorias o de /ranking-categorias (scoped con "|")
      temporadaID,
      deporte,
      tipoDePartido,
      filtroId = null,
    } = req.body ?? {};

    const looksLikeRankingCategoria = typeof categoriaId === "string" && categoriaId.includes("|");

    let masterUpdate = null;
    if (!looksLikeRankingCategoria) {
      masterUpdate = await CambiarCategoriaFederado.execute(id, categoriaId ?? null);
    }

    if (temporadaID && tipoDePartido) {
      await EnsureRankingForFederado.execute({
        federadoId: id,
        temporadaID,
        deporte,
        tipoDePartido,
        filtroId,
        categoriaId: categoriaId ?? null, // acá sí aceptamos el ID con pipes (ranking-categorías)
      });
    }

    return res.json(masterUpdate ?? { ok: true });
  } catch (error) {
    console.error("Error in PATCH /federados/:id/categoria:", error);
    return res.status(400).json({ error: error?.message || "Bad Request" });
  }
}

async cambiarCategoriaFederado(req, res) {
  try {
    const federadoId = req.params.id;
    const {
      categoriaId,
      temporadaID,
      deporte,
      tipoDePartido,
      filtroId = null,
      puntos,
    } = req.body || {};

    const doc = await EnsureRankingForFederado.execute({
      federadoId,
      categoriaId,
      temporadaID,
      deporte,
      tipoDePartido,
      filtroId,
      puntos, 
    });

    return res.status(200).json(doc);
  } catch (err) {
    console.error("Error in PATCH /federados/:id/categoria:", err);
    return res.status(400).json({ error: err?.message || String(err) });
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

  async precarga(req, res) {
    PrecargaFederados.execute();
    res.json({"res": "Usuarios precargados"});
  }
}

export default new UsuarioController();
