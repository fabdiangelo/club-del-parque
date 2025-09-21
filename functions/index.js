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

import userController from "./src/controllers/UserController.js";
import AuthController from "./src/controllers/AuthController.js";
import ReporteController from "./src/controllers/ReporteController.js";


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
app.get("/auth/me", (req, res) => AuthController.getActualUser(req, res));

// Reportes
app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get('/reportes', (req, res) => ReporteController.obtenerReportes(req, res));
// Exportar función HTTP
export const api = functions.https.onRequest(app);