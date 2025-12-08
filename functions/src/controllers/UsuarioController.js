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
    for (const u of usuarios) {


      if (u.notiTokens == null || u.notiTokens.length == 0) {
        continue;
      }
      await enviarNotificacion(u.notiTokens, "Titulo de prueba", "Mensaje de prueba", "https://google.com");
    }

    res.json({ ok: true });
  }

  async GetNotiToken(req, res) {
    try {


      const { uid, token } = req.body;

      const tokens = await new GetNotiToken().execute(uid);
      return res.json(tokens);

    } catch (error) {
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

      if (userId == uid || user.rol == "administrador") {
        const userData = await ObtenerDatosUsuario.execute(userId);
        return res.json(userData);
      }
      const userData = await ObtenerDatosUsuario.execute(userId);

      return res.json({ id: userData.id, nombre: userData.nombre, email: userData.email });
    } catch (error) {
      console.error("Error in /me:", error);
      return res.status(401).json({ error: "Invalid or expired session" });
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

      const {
        categoriaId,            // puede ser ID de /categorias o de /ranking-categorias (scoped con "|")
        deporte,
        filtroId = null,
        temporadaID,
        tipoDePartido,
        puntos,
      } = req.body ?? {};
      let genero = req.body?.genero;

      console.log(`[UsuarioController] cambiarCategoriaFederado: federadoId=${id}, categoriaId=${categoriaId}, temporadaID=${temporadaID}, tipoDePartido=${tipoDePartido}, deporte=${deporte}, filtroId=${filtroId}, puntos=${puntos}`);

      if (!temporadaID || !tipoDePartido) {
        return res.status(400).json({ error: "Faltan temporadaID o tipoDePartido" });
      }

      // Obtener el género del federado
      if (req.body && typeof req.body.genero === "string") {
        genero = req.body.genero.trim().toLowerCase();
      }

      // Importar repositorios necesarios
      const { RankingRepository } = await import("../infraestructure/adapters/RankingRepository.js");
      const { CategoriaRepository } = await import("../infraestructure/adapters/CategoriaRepository.js");
      const rankingRepo = new RankingRepository();
      const categoriaRepo = new CategoriaRepository();

      // Buscar ranking actual del federado en el scope
      const allRankings = await rankingRepo.getAll();
      let rankingActual = allRankings.find(r =>
        r.usuarioID === id &&
        r.temporadaID === temporadaID &&
        r.tipoDePartido === tipoDePartido &&
        (deporte ? r.deporte.toLowerCase() === deporte.toLowerCase() : true)
      );

      console.log(`[UsuarioController] rankingActual: ${rankingActual ? JSON.stringify(rankingActual) : "none"}`);

      // Si se especifica una nueva categoriaId, verificar capacidad
      if (categoriaId) {
        const cat = await categoriaRepo.getById(categoriaId);
        if (!cat) return res.status(400).json({ error: "Categoría no encontrada" });
        const rankingsEnCategoria = allRankings.filter(r =>
          r.categoriaId === categoriaId &&
          r.temporadaID === temporadaID &&
          r.tipoDePartido === tipoDePartido &&
          (deporte ? r.deporte.toLowerCase() === deporte.toLowerCase() : true)
        );
        console.log(`[UsuarioController] Rankings en categoria destino: ${rankingsEnCategoria.length} / ${cat.capacidad}`);
        if (rankingsEnCategoria.length >= cat.capacidad) {
          return res.status(400).json({ error: "La categoría destino está llena (capacidad máxima alcanzada)" });
        }
      }

      // Si existe ranking actual y la categoría es diferente, eliminar ranking anterior
      let puntosFinal = puntos;
      let partidosGanados = 0;
      let partidosPerdidos = 0;
      let partidosAbandonados = 0;
      if (rankingActual) {
        partidosGanados = rankingActual.partidosGanados;
        partidosPerdidos = rankingActual.partidosPerdidos;
        partidosAbandonados = rankingActual.partidosAbandonados;
        // Si la categoría cambia, eliminar ranking anterior
        if (rankingActual.categoriaId !== categoriaId) {
          // Si no se especifican nuevos puntos, conservar los anteriores
          if (typeof puntos === "undefined" || puntos === null) {
            puntosFinal = rankingActual.puntos;
          }
          await rankingRepo.delete(rankingActual.id);
        } else {
          // Si la categoría no cambia, actualizar puntos si se especifican
          if (typeof puntos !== "undefined" && puntos !== null) {
            puntosFinal = puntos;
          } else {
            puntosFinal = rankingActual.puntos;
          }
        }
      } else {
        // Si no existe ranking previo, inicializar stats en 0
        puntosFinal = typeof puntos !== "undefined" && puntos !== null ? puntos : 0;
      }

      // Crear/actualizar ranking con stats preservados
      const EnsureRankingForFederado = (await import("../usecases/Rankings/EnsureRankingForFederado.js")).default;
      const ranking = await EnsureRankingForFederado.execute({
        federadoId: id,
        temporadaID,
        deporte,
        tipoDePartido,
        filtroId,
        categoriaId: categoriaId ?? null,
        puntos: puntosFinal,
        genero,
        partidosGanados,
        partidosPerdidos,
        partidosAbandonados,
      });

      // Obtener rankings actualizados filtrados por género
      const ListarRankings = (await import("../usecases/Rankings/ListarRankings.js")).default;
      const rankingsFiltrados = await ListarRankings.execute({
        temporadaID,
        tipoDePartido,
        deporte,
        filtroId,
        leaderboard: true,
        genero
      });

      return res.json({ ok: true, ranking, rankings: rankingsFiltrados });
    } catch (error) {
      console.error("Error in PATCH /federados/:id/categoria:", error);
      return res.status(400).json({ error: error?.message || "Bad Request" });
    }
  }
  async getFederadoById(req, res) {

    const { id } = req.params;
    try {
      const federado = await getFederadoById.execute(id);
      if (!federado) {
        return res.status(404).json({ error: "Federado no encontrado" });
      }

      return res.json(federado);
    } catch (error) {
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

  async getAllUsuarios(req, res) {
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

  async editarUsuario(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      const userId = req.params.id;
      if (userId !== user.uid && user.rol !== "administrador") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const updateData = req.body;
      if (!updateData || typeof updateData !== "object") {
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

  async cantUsuarios(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if (user.rol !== "administrador") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const cant = await GetCantUsuarios.execute();
      return res.json(cant);
    } catch (error) {
      console.error("Error in /usuarios/cantidad:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async validarFederacion(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if (user.rol !== "administrador") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const idReporte = req.params.idReporte;
      if (!idReporte) {
        return res.status(400).json({ error: "Falta idReporte" });
      }
      const userId = idReporte.split("-")[0];
      if (!userId) {
        return res.status(400).json({ error: "idReporte inválido" });
      }

      const planId = req.body.planId;
      if (!planId) {
        return res.status(400).json({ error: "Falta planId" });
      }

      const usuarioAFederar = await ObtenerDatosUsuario.execute(userId);
      if (!usuarioAFederar) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      await FederarUsuario.execute(usuarioAFederar, planId);

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error in /usuarios/validar-federacion/:idReporte:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async negarFederacion(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if (user.rol !== "administrador") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const idReporte = req.params.idReporte;
      if (!idReporte) {
        return res.status(400).json({ error: "Falta idReporte" });
      }

      const userId = idReporte.split("-")[0];
      if (!userId) {
        return res.status(400).json({ error: "idReporte inválido" });
      }

      const usuarioAActivar = await ObtenerDatosUsuario.execute(userId);
      if (!usuarioAActivar) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      await ActualizarUsuario.execute(userId, { rol: usuarioAActivar.rol, estado: "activo" });

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error in /usuarios/negar-federacion/:idReporte:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  // functions/src/controllers/UsuarioController.js  (inside class)
  // ...existing code...
  async bloquearUsuario(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const user = GetActualUser.execute(sessionCookie)
      if (user.rol !== "administrador") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const usuarioId = req.params.id;
      if (!usuarioId) {
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
    res.json({ "res": "Usuarios precargados" });
  }
}

export default new UsuarioController();