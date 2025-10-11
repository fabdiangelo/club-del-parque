import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import NoticiaController from "./src/controllers/NoticiaController.js";
import AuthController from "./src/controllers/AuthController.js";
import AdministradorController from "./src/controllers/AdministradorController.js";
import ReporteController from "./src/controllers/ReporteController.js";
import SendWhatsappController from "./src/controllers/SendWhatsappController.js";
import EmailController from "./src/controllers/EmailController.js";
import ChatController from "./src/controllers/ChatController.js";
import UsuarioController from "./src/controllers/UsuarioController.js";
import InfraestructuraController from "./src/controllers/InfraestructuraController.js";
import PlanController from "./src/controllers/PlanController.js";
import FormatoController from "./src/controllers/FormatoController.js";
import CampeonatosController from "./src/controllers/CampeonatosController.js";
import FormatoEtapaController from "./src/controllers/FormatoEtapaController.js";
import CampeonatosFederadosController from "./src/controllers/CampeonatosFederadosController.js";

/* ---------------- Global fn settings ---------------- */
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 180,
  memory: "512MB",
});

/* ---------------- Boot logs (sanity) ---------------- */
console.log("[boot] GCLOUD_PROJECT =", process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT);
console.log("[boot] GCLOUD_STORAGE_BUCKET =", process.env.GCLOUD_STORAGE_BUCKET || "(unset)");
console.log("[boot] STORAGE_EMULATOR_HOST =", process.env.STORAGE_EMULATOR_HOST || "(unset)");

/* ---------------- App + CORS ---------------- */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

/* ---------------- Parsers ---------------- */
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());

/* ---------------- Routes ---------------- */
// Auth
app.post("/auth/register", (req, res) => AuthController.register(req, res));
app.post("/auth/login", (req, res) => AuthController.loginWithPassword(req, res));
app.post("/auth/google", (req, res) => AuthController.loginWithGoogle(req, res));
app.get("/auth/me", (req, res) => AuthController.getActualUser(req, res));
app.post("/auth/logout", (req, res) => AuthController.logout(req, res));

// Administrador
app.post("/administrador/register", (req, res) => AdministradorController.crearAdministrador(req, res));

// Usuario
app.get("/usuario/:id", (req, res) => UsuarioController.getUserData(req, res));
app.put("/usuario/:id", (req, res) => UsuarioController.editarUsuario(req, res));
app.put("/usuario/:id/bloqueo", (req, res) => UsuarioController.bloquearUsuario(req, res));
app.get("/usuarios", (req, res) => UsuarioController.getAllUsuarios(req, res));
app.get("/usuarios/cantidad", (req, res) => UsuarioController.cantUsuarios(req, res));
app.post("/usuarios/validar-federacion/:idReporte", (req, res) => UsuarioController.validarFederacion(req, res));
app.put("/usuarios/negar-federacion/:idReporte", (req, res) => UsuarioController.negarFederacion(req, res));

// Reportes
app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get("/reportes", (req, res) => ReporteController.obtenerReportes(req, res));
app.get("/reportes/sin-resolver", (req, res) => ReporteController.obtenerCantReportesSinResolver(req, res));
app.post("/reporte/:id/solicitud-federacion", (req, res) => ReporteController.solicitarFederarUsuario(req, res));
app.put("/reportes/marcar-resuelto/:id", (req, res) => ReporteController.marcarResuelto(req, res));

// Noticias
app.get("/noticias", (req, res) => NoticiaController.listar(req, res));
app.get("/noticias/:id", (req, res) => NoticiaController.obtenerPorId(req, res));
app.post("/noticias", (req, res) => NoticiaController.crear(req, res));
app.put("/noticias/:id", (req, res) => NoticiaController.actualizar(req, res));
app.delete("/noticias/:id", (req, res) => NoticiaController.eliminar(req, res));
app.delete("/noticias/:id/imagenes/:index?", async (req, res) => {
  try {
    const { id, index: idxParam } = req.params;
    let index = typeof idxParam !== "undefined" ? Number(idxParam) : undefined;
    const imagePath =
      req.query.imagePath ||
      (req.body && typeof req.body.imagePath === "string" ? req.body.imagePath : undefined);

    if (typeof index === "number" && Number.isFinite(index)) {
      
    } else if (imagePath) {
      index = undefined; 
    } else if (req.body && typeof req.body.index === "number") {
      index = req.body.index;
    } else {
      return res.status(400).json({ error: "Provide imagePath or index" });
    }
    const ref = typeof index === "number" ? { index } : { imagePath };
    const out = await NoticiaController.eliminarImagenBy(id, ref);
    if (!out?.ok) return res.status(404).json({ error: "Imagen no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    console.error("DEL imagen error:", e);
    res.status(400).json({ error: e?.message || "Error eliminando imagen" });
  }
});
app.post("/noticias/:id/imagenes-json", async (req, res) => {
  try {
    try { req.setTimeout(0); } catch {}
    const { id } = req.params;
    const { images } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Faltan imágenes (images[])" });
    }

    const normalized = images.map((it, i) => {
      const fileName = it?.filename || `image-${i}.bin`;
      const contentType = it?.contentType || "application/octet-stream";
      const dataB64 = it?.dataBase64;
      if (typeof dataB64 !== "string" || dataB64.length === 0) {
        throw new Error(`Imagen #${i} inválida (dataBase64)`);
      }
      const buffer = Buffer.from(dataB64, "base64");
      return {
        buffer,
        originalname: fileName,
        mimetype: contentType,
        size: buffer.length,
      };
    });
    console.log(`[imagenes-json] ${id}: ${normalized.length} file(s)`);
    const result = await NoticiaController.subirImagenes(id, normalized);
    return res.json(result);
  } catch (err) {
    const msg = err?.message || String(err);
    console.error("imagenes-json ERROR:", msg);
    if (/noticia not found/i.test(msg)) return res.status(404).json({ error: msg });
    if (/too large|entity too large|payload too large/i.test(msg)) {
      return res.status(413).json({ error: "Payload demasiado grande" });
    }
    return res.status(400).json({ error: msg });
  }
});

// Datos de la infraestructura
app.get('/infraestructura/metricas', async (req, res) => InfraestructuraController.obtenerMetricas(req, res));

// Notificaciones
app.post('/sendWhatsapp', (req, res) => SendWhatsappController.enviarMensaje(req, res)); 
app.post('/sendEmail', (req, res) => EmailController.enviar(req, res));

// Chat
app.get('/chats/:idUser', (req, res) => ChatController.getChatByUser(req, res));
app.post('/chats', (req, res) => ChatController.crearChat(req, res));
app.get('/chats/:chatId', (req, res) => ChatController.getChatById(req, res));
app.post('/chats/:id/mensajes', (req, res) => ChatController.enviarMensaje(req, res));
app.get('/chats/:id/mensajes', (req, res) => ChatController.getMensajes(req, res));
app.get('/chats/:id/escuchar', (req, res) => ChatController.escucharPorMensajes(req, res));
app.get('/chats/prueba', (req, res) => ChatController.prueba(req, res));

// Planes
app.post('/planes/precarga', (req, res) => PlanController.precargarPlanes(req, res));
app.get('/planes', (req, res) => PlanController.getPlanes(req, res));

// Formatos de campeonatos
app.post('/formatos/precarga', (req, res) => FormatoController.precargarFormatos(req, res));
app.get('/formatos', (req, res) => FormatoController.getFormatos(req, res));
app.post('/formatos', (req, res) => FormatoController.saveFormato(req, res));
app.put('/formatos/:id', (req, res) => FormatoController.saveFormato(req, res));

// Formatos de etapa
app.get('/formatos/etapas', (req, res) => FormatoEtapaController.getFormatosEtapas(req, res));
app.post('/formatos/etapas', (req, res) => FormatoEtapaController.saveFormatoEtapa(req, res));
app.put('/formatos/etapas/:id', (req, res) => FormatoEtapaController.saveFormatoEtapa(req, res));

// Campeonatos
app.get('/campeonatos', (req, res) => CampeonatosController.getAllCampeonatos(req, res));
app.get('/campeonato/:id', (req, res) => CampeonatosController.getCampeonatoById(req, res));
app.post('/campeonatos', (req, res) => CampeonatosController.crear(req, res));
app.get('/campeonatos/federados/count', (req, res) => CampeonatosFederadosController.contar(req, res));

// Mensajes por terceros
app.post('/sendWhatsapp', (req, res) => SendWhatsappController.enviarMensaje(req, res)); 
app.post('/sendEmail', (req, res) => EmailController.enviar(req, res));

// Chat
app.get('/chats/:idUser', (req, res) => ChatController.getChatByUser(req, res));
app.post('/chats', (req, res) => ChatController.crearChat(req, res));
app.get('/chats/:chatId', (req, res) => ChatController.getChatById(req, res));
app.post('/chats/:id/mensajes', (req, res) => ChatController.enviarMensaje(req, res));
app.get('/chats/:id/mensajes', (req, res) => ChatController.getMensajes(req, res));
app.get('/chats/:id/escuchar', (req, res) => ChatController.escucharPorMensajes(req, res));
app.get('/chats/prueba', (req, res) => ChatController.prueba(req, res));

/* ---------------- Errors ---------------- */
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Exportar función HTTP
export const api = functions.https.onRequest(app);
