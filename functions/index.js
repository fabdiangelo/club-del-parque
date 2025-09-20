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

// Para logs podés seguir usando el logger de firebase-functions
// import * as logger from "firebase-functions/logger.js";

// Limitar instancias (control de costes)
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

// Rutas
app.post("/auth/register", (req, res) => userController.register(req, res));
app.post("/auth/login", (req, res) => AuthController.loginWithPassword(req, res));
app.post("/auth/google", (req, res) => AuthController.loginWithGoogle(req, res));

// Exportar función HTTP
export const api = functions.https.onRequest(app);