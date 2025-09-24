// functions/index.js
import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
// import multer from "multer";  // temporarily not needed

import NoticiaController from "./src/controllers/NoticiaController.js";
import UserController from "./src/controllers/UserController.js";
import AuthController from "./src/controllers/AuthController.js";
import ReporteController from "./src/controllers/ReporteController.js";
import SendWhatsappController from "./src/controllers/SendWhatsappController.js";
import EmailController from "./src/controllers/EmailController.js";

setGlobalOptions({ maxInstances: 10 });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const app = express();

/* ---------------- JSON body-parser ---------------- */
const jsonParser = bodyParser.json();
app.use((req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (/^multipart\/form-data/i.test(ct)) {
    // reject multipart for now
    return res.status(415).json({
      error: "Uploads temporarily disabled. Send JSON (application/json) without image.",
    });
  }
  return jsonParser(req, res, next);
});

/* ---------------- Middlewares ---------------- */
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(cookieParser());

/* ---------------- Routes ---------------- */
// Auth
app.post("/auth/register", (req, res) => AuthController.register(req, res));
app.post("/auth/login", (req, res) => AuthController.loginWithPassword(req, res));
app.post("/auth/google", (req, res) => AuthController.loginWithGoogle(req, res));
app.get("/auth/me", (req, res) => AuthController.getActualUser(req, res));
app.post("/auth/logout", (req, res) => AuthController.logout(req, res));

// Usuario
app.get("/usuario/:id", (req, res) => UserController.getUserData(req, res));

// Reportes
app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get("/reportes", (req, res) => ReporteController.obtenerReportes(req, res));

// Noticias
app.get("/noticias", (req, res) => NoticiaController.listar(req, res));
app.get("/noticias/:id", (req, res) => NoticiaController.obtenerPorId(req, res));
app.post("/noticias", (req, res) => NoticiaController.crear(req, res)); // JSON only
app.put("/noticias/:id", (req, res) => NoticiaController.actualizar(req, res)); // JSON only
// image routes disabled for now
// app.post("/noticias/:id/imagen", ...);
// app.delete("/noticias/:id/imagen", ...);
app.delete("/noticias/:id", (req, res) => NoticiaController.eliminar(req, res));

// Whatsapp & Email
app.post("/sendWhatsapp", (req, res) => SendWhatsappController.enviarMensaje(req, res));
app.post("/sendEmail", (req, res) => EmailController.enviar(req, res));

/* ---------------- Error handlers ---------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------- Export Firebase Function ---------------- */
export const api = functions.https.onRequest(app);
