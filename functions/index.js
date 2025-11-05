// functions/index.js  (ESM)
import * as functions from "firebase-functions/v1"; // v1 compat API
import { setGlobalOptions } from "firebase-functions/v2";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from 'multer';

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
import PartidoController from "./src/controllers/PartidoController.js";
import CanchaController from "./src/controllers/CanchaController.js";
import TemporadaController from "./src/controllers/TemporadaController.js";
import ReservaController from "./src/controllers/ReservaController.js";
import RankingsController from "./src/controllers/RankingsController.js";
import RankingCategoriasController from "./src/controllers/RankingCategoriasController.js";
import CategoriaController from "./src/controllers/CategoriaController.js";
import ModalidadController from "./src/controllers/ModalidadController.js";
import GeneroController from "./src/controllers/GeneroController.js";
import DeporteController from "./src/controllers/DeporteController.js";
import FiltrosController from "./src/controllers/FiltrosController.js";


/* ---------------- Boot logs ---------------- */
console.log(
  "[boot] GCLOUD_PROJECT =",
  process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
);
console.log(
  "[boot] GCLOUD_STORAGE_BUCKET =",
  process.env.GCLOUD_STORAGE_BUCKET || "(unset)"
);
console.log(
  "[boot] STORAGE_EMULATOR_HOST =",
  process.env.STORAGE_EMULATOR_HOST || "(unset)"
);

/* ---------------- Global fn settings ---------------- */
// setGlobalOptions({
//   maxInstances: 10,
//   timeoutSeconds: 180,
//   memory: "512MB",
// });

/* ---------------- Boot logs (sanity) ---------------- */
console.log("[boot] GCLOUD_PROJECT =", process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT);
console.log("[boot] GCLOUD_STORAGE_BUCKET =", process.env.GCLOUD_STORAGE_BUCKET || "(unset)");
console.log("[boot] STORAGE_EMULATOR_HOST =", process.env.STORAGE_EMULATOR_HOST || "(unset)");

/* ---------------- PDFs ---------------- */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });


/* ---------------- App + CORS ---------------- */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // allow credentials so browser can send cookies when frontend uses credentials: 'include'
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.options("*", cors());

// Parse cookies early so handlers (including the upload handler) can read session cookie
app.use(cookieParser());

// Register reglamento upload route BEFORE body parser so multer receives raw multipart stream
// Add a tiny logger for headers/length and listen for aborted connections to help debug truncation issues
app.post(
  '/campeonato/:id/reglamento',
  (req, res, next) => {
    console.log('[upload] headers:', { 'content-type': req.headers['content-type'], 'content-length': req.headers['content-length'] });
    req.on('aborted', () => console.warn('[upload] request aborted by client'));
    next();
  },
  upload.single('reglamento'),
  (req, res) => CampeonatosController.uploadReglamento(req, res)
);

/* ---------------- Parsers ---------------- */
app.use(bodyParser.json({ limit: "50mb" }));
// cookieParser() was registered earlier so upload route and controllers can read cookies before body parsing

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

app.get("/usuarios/federados", (req, res) => UsuarioController.getAllFederados(req, res));
app.post("/federados/precarga", (req, res) => UsuarioController.precarga(req, res));
app.get("/federados/:id", (req, res) => UsuarioController.getFederadoById(req, res));
app.patch("/federados/:id/categoria", (req, res) => UsuarioController.cambiarCategoriaFederado(req, res));


// Categorías
app.patch("/categorias/orden", (req, res) => CategoriaController.setOrden(req, res));
app.post("/categorias", (req, res) => CategoriaController.crearCategoria(req, res));
app.get("/categorias", (req, res) => CategoriaController.getAllCategorias(req, res));
app.get("/categorias/:id", (req, res) => CategoriaController.getById(req, res));
app.patch("/categorias/:id", (req, res) => CategoriaController.actualizarCategoria(req, res));
app.delete("/categorias/:id", (req, res) => CategoriaController.eliminarCategoria(req, res));

/*FILTROS*/

app.get("/deportes", (req, res) => DeporteController.getAll(req, res));
app.get("/deportes/:id", (req, res) => DeporteController.getById(req, res));
app.post("/deportes", (req, res) => DeporteController.create(req, res));
app.patch("/deportes/:id", (req, res) => DeporteController.update(req, res));
app.delete("/deportes/:id", (req, res) => DeporteController.delete(req, res));

app.get("/modalidades", (req, res) => ModalidadController.getAll(req, res));
app.post("/modalidades", (req, res) => ModalidadController.create(req, res));
app.delete("/modalidades/:nombre", (req, res) => ModalidadController.delete(req, res));

app.get("/generos", (req, res) => GeneroController.getAll(req, res));
app.post("/generos", (req, res) => GeneroController.create(req, res));
app.delete("/generos/:nombre", (req, res) => GeneroController.delete(req, res));

app.get("/filtros", (req, res) => FiltrosController.getAll(req, res));
app.get("/filtros/:id", (req, res) => FiltrosController.getById(req, res));
app.post("/filtros", (req, res) => FiltrosController.create(req, res));
app.patch("/filtros/:id", (req, res) => FiltrosController.update(req, res));
app.delete("/filtros/:id", (req, res) => FiltrosController.delete(req, res));
// Reportes
app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get("/reportes", (req, res) => ReporteController.obtenerReportes(req, res));
app.get("/reportes/sin-resolver", (req, res) => ReporteController.obtenerCantReportesSinResolver(req, res));
app.post("/reporte/:id/solicitud-federacion", (req, res) => ReporteController.solicitarFederarUsuario(req, res));
app.put("/reportes/marcar-resuelto/:id", (req, res) => ReporteController.marcarResuelto(req, res));
//RANKING
app.post("/rankings", (req, res) => RankingsController.crear(req, res));
app.get("/rankings", (req, res) => RankingsController.listar(req, res));
app.get("/rankings/:id", (req, res) => RankingsController.getById(req, res));
app.patch("/rankings/:id", (req, res) => RankingsController.editar(req, res));
app.post("/rankings/:id/ajustar", (req, res) => RankingsController.ajustar(req, res));
app.post("/rankings/:id/reset", (req, res) => RankingsController.reset(req, res));
app.delete("/rankings/:id", (req, res) => RankingsController.eliminar(req, res));
// Noticias
app.get("/noticias", (req, res) => NoticiaController.listar(req, res));
app.get("/noticias/:id", (req, res) => NoticiaController.obtenerPorId(req, res));
app.post("/noticias", (req, res) => NoticiaController.crear(req, res));
app.put("/noticias/:id", (req, res) => NoticiaController.actualizar(req, res));
app.delete("/noticias/:id", (req, res) => NoticiaController.eliminar(req, res));
app.delete("/noticias/:id/imagenes/:index?", async (req, res) => NoticiaController.eliminarImagenID(req, res));
app.post("/noticias/:id/imagenes-json", async (req, res) => NoticiaController.subirImagenesID(req, res));

// Infraestructura
app.get("/infraestructura/metricas", (req, res) => InfraestructuraController.obtenerMetricas(req, res));

// Notificaciones
app.post("/sendWhatsapp", (req, res) => SendWhatsappController.enviarMensaje(req, res));
app.post("/sendEmail", (req, res) => EmailController.enviar(req, res));

// Chat
app.get("/chats/:idUser", (req, res) => ChatController.getChatByUser(req, res));
app.post("/chats", (req, res) => ChatController.crearChat(req, res));
app.get("/chats/:chatId", (req, res) => ChatController.getChatById(req, res));
app.post("/chats/:id/mensajes", (req, res) => ChatController.enviarMensaje(req, res));
app.get("/chats/:id/mensajes", (req, res) => ChatController.getMensajes(req, res));
app.get("/chats/:id/escuchar", (req, res) => ChatController.escucharPorMensajes(req, res));
app.get("/chats/prueba", (req, res) => ChatController.prueba(req, res));

// Planes
app.post("/planes/precarga", (req, res) => PlanController.precargarPlanes(req, res));
app.get("/planes", (req, res) => PlanController.getPlanes(req, res));

// Formatos de campeonatos
app.post("/formatos/precarga", (req, res) => FormatoController.precargarFormatos(req, res));
app.get("/formatos", (req, res) => FormatoController.getFormatos(req, res));
app.post("/formatos", (req, res) => FormatoController.saveFormato(req, res));
app.put("/formatos/:id", (req, res) => FormatoController.saveFormato(req, res));

// Formatos de etapa
app.get("/formatos/etapas", (req, res) => FormatoEtapaController.getFormatosEtapas(req, res));
app.post("/formatos/etapas", (req, res) => FormatoEtapaController.saveFormatoEtapa(req, res));
app.put("/formatos/etapas/:id", (req, res) => FormatoEtapaController.saveFormatoEtapa(req, res));

// Campeonatos
app.get("/campeonatos", (req, res) => CampeonatosController.getAllCampeonatos(req, res));
app.get("/campeonato/:id", (req, res) => CampeonatosController.getCampeonatoById(req, res));
app.put('/campeonato/:id', (req, res) => CampeonatosController.editarCampeonato(req, res));
app.post("/campeonatos", (req, res) => CampeonatosController.crear(req, res));
app.get("/campeonatos/federados/count", (req, res) => CampeonatosFederadosController.contar(req, res));

// Procesar inicio de campeonato (expirar invitaciones, combinar grupos, descalificar solitarios)
app.post('/campeonato/:id/procesar-inicio', (req, res) => CampeonatosController.procesarInicio(req, res));

// Campeonatos-Federados
app.post("/federado-campeonato/:id/:uid", (req, res) => CampeonatosFederadosController.inscribirFederado(req, res));

// Invitaciones: aceptar / rechazar
app.put('/federado-campeonato/:id/invitacion/aceptar', (req, res) => CampeonatosFederadosController.aceptarInvitacion(req, res));
app.put('/federado-campeonato/:id/invitacion/rechazar', (req, res) => CampeonatosFederadosController.rechazarInvitacion(req, res));

// Mensajes por terceros
app.post("/sendWhatsapp", (req, res) => SendWhatsappController.enviarMensaje(req, res));
app.post("/sendEmail", (req, res) => EmailController.enviar(req, res));

// Chat
app.get("/chats/:idUser", (req, res) => ChatController.getChatByUser(req, res));
app.post("/chats", (req, res) => ChatController.crearChat(req, res));
app.get("/chats/:chatId", (req, res) => ChatController.getChatById(req, res));
app.post("/chats/:id/mensajes", (req, res) => ChatController.enviarMensaje(req, res));
app.get("/chats/:id/mensajes", (req, res) => ChatController.getMensajes(req, res));
app.get("/chats/:id/escuchar", (req, res) => ChatController.escucharPorMensajes(req, res));
app.get("/chats/prueba", (req, res) => ChatController.prueba(req, res));

// Partidos
app.get("/partidos/:id", (req, res) => PartidoController.getPartidoById(req, res));
app.put("/partidos/:id", (req, res) => PartidoController.editarPartido(req, res));
app.post("/partidos", (req, res) => PartidoController.crearPartido(req, res));
app.get("/partidos", (req, res) => PartidoController.getAllPartidos(req, res));
app.get("/partidos/temporada/:temporadaID", (req, res) => PartidoController.getPartidosByTemporada(req, res));
app.get("/partidos/jugador/:jugadorID", (req, res) => PartidoController.getPartidosByJugador(req, res));
app.delete("/partidos/:id", (req, res) => PartidoController.eliminarPartido(req, res));
app.post("/partidos/:id/ganadores", (req, res) => PartidoController.setGanadores(req, res));
app.post("/partidos/:id/disponibilidad", (req, res) => PartidoController.agregarDisponibilidad(req, res));
app.put("/partidos/:id/confirmar-horario", (req, res) => PartidoController.aceptarPropuesta(req, res));


// Temporada
app.get("/temporadas/:id", (req, res) => TemporadaController.getTemporadaById(req, res));
app.post("/temporadas", (req, res) => TemporadaController.createTemporada(req, res));
app.delete("/temporadas/:id", (req, res) => TemporadaController.deleteTemporada(req, res));
app.get("/temporadas", (req, res) => TemporadaController.getAllTemporadas(req, res));

// Cancha
app.get("/canchas/:id", (req, res) => CanchaController.getById(req, res));
app.post("/canchas", (req, res) => CanchaController.crearCancha(req, res));
app.delete("/canchas/:id", (req, res) => CanchaController.eliminarCancha(req, res));
app.get("/canchas", (req, res) => CanchaController.getAll(req, res));
//
app.patch("/ranking-categorias/orden", (req, res) =>
  RankingCategoriasController.setOrden(req, res)
);

// other routes
app.post("/ranking-categorias", (req, res) => RankingCategoriasController.crear(req, res));
app.get("/ranking-categorias", (req, res) => RankingCategoriasController.listar(req, res));
app.get("/ranking-categorias/:id", (req, res) => RankingCategoriasController.getById(req, res));
// keep this AFTER /orden
app.patch("/ranking-categorias/:id", (req, res) => RankingCategoriasController.editar(req, res));
app.delete("/ranking-categorias/:id", (req, res) => RankingCategoriasController.eliminar(req, res));

//Reservas

app.get('/reservas', (req, res) => ReservaController.getAll(req, res));
app.get('/reservas/partido/:partidoId', (req, res) => ReservaController.getReservaByPartidoId(req, res));
app.get('/reservas/:id', (req, res) => ReservaController.getReservaById(req, res));
app.post('/reservas', (req, res) => ReservaController.crearReserva(req, res));
app.delete('/reservas/:id', (req, res) => ReservaController.cancelarReserva(req, res));
app.put('/reservas/:id/rechazar', (req, res) => ReservaController.rechazarReserva(req, res));
app.put('/reservas/:id/confirmar', (req, res) => ReservaController.confirmarReserva(req, res));
app.put('/reservas/:id', (req, res) => ReservaController.editarReserva(req, res));
app.put('/reservas/:reservaID/aceptar-invitacion', (req, res) => ReservaController.aceptarInvitacion(req, res));
app.put('/reservas/:id/deshabilitar', (req, res) => ReservaController.deshabilitarReserva(req, res));
app.put('/reservas/:id/habilitar', (req, res) => ReservaController.habilitarReserva(req, res));
app.get('/reservas-futuro', (req, res) => ReservaController.getReservasFuturo(req, res));


app.get("/_health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/_routes", (_req, res) => {
  const list = [];
  app._router.stack.forEach((m) => {
    if (m.route?.path) {
      const methods = Object.keys(m.route.methods).map(m => m.toUpperCase());
      list.push({ path: m.route.path, methods });
    }
  });
  res.json({ base: "/us-central1/api", routes: list });
});
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export const api = functions
  .region("us-central1")
  .runWith({ memory: "512MB", timeoutSeconds: 180, maxInstances: 10 })
  .https.onRequest(app);
