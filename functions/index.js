/**
 * Import function triggers from their respective submodules:
 *
 * import { onCall } from "firebase-functions/v2/https";
 * import { onDocumentWritten } from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import UserController from "./src/controllers/UserController.js";
import AuthController from "./src/controllers/AuthController.js";
import ReporteController from "./src/controllers/ReporteController.js";
import SendWhatsappController from "./src/controllers/SendWhatsappController.js";
import EmailController from "./src/controllers/EmailController.js";
import ChatController from "./src/controllers/ChatController.js";
import UsuarioController from "./src/controllers/UsuarioController.js";

setGlobalOptions({ maxInstances: 10 });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

app.use(bodyParser.json());
app.use(cookieParser());

// Auth
app.post("/auth/register", (req, res) => AuthController.register(req, res));
app.post("/auth/login", (req, res) => AuthController.loginWithPassword(req, res));
app.post("/auth/google", (req, res) => AuthController.loginWithGoogle(req, res));

app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get('/reportes', (req, res) => ReporteController.obtenerReportes(req, res));
app.get("/auth/me", (req, res) => AuthController.getActualUser(req, res));
app.post("/auth/logout", (req, res) => AuthController.logout(req, res));

// Usuario
app.get("/usuario/:id", (req, res) => UserController.getUserData(req, res));
app.get("/usuarios", (req, res) => UsuarioController.getAllUsuarios(req, res));

// Reportes
app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get('/reportes', (req, res) => ReporteController.obtenerReportes(req, res));

app.post('/sendWhatsapp', (req, res) => SendWhatsappController.enviarMensaje(req, res)); 
app.post('/sendEmail', (req, res) => EmailController.enviar(req, res));
// Exportar función HTTP

// Chat

app.get('/chats/:idUser', (req, res) => ChatController.getChatByUser(req, res));
app.post('/chats', (req, res) => ChatController.crearChat(req, res));
app.get('/chats/:chatId', (req, res) => ChatController.getChatById(req, res));
app.post('/chats/:id/mensajes', (req, res) => ChatController.enviarMensaje(req, res));
app.get('/chats/:id/mensajes', (req, res) => ChatController.getMensajes(req, res));
app.get('/chats/:id/escuchar', (req, res) => ChatController.escucharPorMensajes(req, res));
app.get('/chats/prueba', (req, res) => ChatController.prueba(req, res));
export const api = functions.https.onRequest(app);