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
import cors from "cors";

import userController from "./src/controllers/UserController.js";
import AuthController from "./src/controllers/AuthController.js";

// Para logs podés seguir usando el logger de firebase-functions
// import * as logger from "firebase-functions/logger.js";

// Limitar instancias (control de costes)
setGlobalOptions({ maxInstances: 10 });

// Crear app express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.post("/register", (req, res) => userController.register(req, res));
app.post("/auth/login", (req, res) => AuthController.loginWithPassword(req, res));
app.post("/auth/google", (req, res) => AuthController.loginWithGoogle(req, res));
// Exportar función HTTP
export const api = functions.https.onRequest(app);
