import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import formidable from "formidable";
import { readFile as fsReadFile } from "fs/promises";

import NoticiaController from "./src/controllers/NoticiaController.js";
import UserController from "./src/controllers/UserController.js";
import AuthController from "./src/controllers/AuthController.js";
import ReporteController from "./src/controllers/ReporteController.js";
import SendWhatsappController from "./src/controllers/SendWhatsappController.js";
import EmailController from "./src/controllers/EmailController.js";

setGlobalOptions({ maxInstances: 10 });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const app = express();

/* ---------------- Core middlewares ---------------- */
app.use(cors({
  origin: FRONTEND_URL,
  credentials: false, // we’re not using cookies right now
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());

const jsonParser = bodyParser.json();
app.use((req, res, next) => {
  const ct = req.headers["content-type"] || "";
  // Let JSON through; let multipart be handled only in the *images* route below.
  if (/^application\/json/i.test(ct) || !ct) return jsonParser(req, res, next);
  return next();
});
app.use(cookieParser());

/* ---------------- Helpers ---------------- */
const isMultipart = (ct = "") => /^multipart\/form-data/i.test(ct);

/**
 * Parse multiple images from a multipart request using Formidable.
 * The client should send one or many files with field name "imagenes".
 * We normalize to an array of { buffer, originalname, mimetype, size }.
 */
async function parseMultipleImages(req) {
  const ct = req.headers["content-type"] || "";
  if (!isMultipart(ct)) {
    const e = new Error("Expected multipart/form-data");
    e.status = 415;
    throw e;
  }

  const form = formidable({
    multiples: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB per file
    keepExtensions: true,
  });

  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fieldsOut, filesOut) => {
      if (err) return reject(err);
      resolve({ fields: fieldsOut, files: filesOut });
    });
  });

  // Normalize to array from files.imagenes (could be single or array)
  const list = [];
  const raw = Array.isArray(files?.imagenes) ? files.imagenes : (files?.imagenes ? [files.imagenes] : []);
  for (const f of raw) {
    const buffer = await fsReadFile(f.filepath);
    list.push({
      buffer,
      originalname: f.originalFilename || "uploaded",
      mimetype: f.mimetype || "application/octet-stream",
      size: buffer.length,
    });
  }

  return { fields, images: list };
}

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

// Noticias (JSON CRUD — unchanged)
app.get("/noticias", (req, res) => NoticiaController.listar(req, res));
app.get("/noticias/:id", (req, res) => NoticiaController.obtenerPorId(req, res));
app.post("/noticias", (req, res) => NoticiaController.crear(req, res));          // JSON-only
app.put("/noticias/:id", (req, res) => NoticiaController.actualizar(req, res));  // JSON-only
app.delete("/noticias/:id", (req, res) => NoticiaController.eliminar(req, res));

// Images — NEW: add one or many images after creating the noticia
app.post("/noticias/:id/imagenes", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = await parseMultipleImages(req);
    if (!images.length) return res.status(400).json({ error: "Faltan imágenes (field: 'imagenes')" });

    // Hand off to controller (we’ll add subirImagenes below)
    const result = await NoticiaController.subirImagenes(id, images);
    res.json(result); // e.g. { added: [ {imageUrl, imagePath}, ... ] }
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (/maxFileSize/i.test(err?.message || "")) return res.status(413).json({ error: "Archivo demasiado grande" });
    console.error("Imagenes upload error:", err);
    res.status(400).json({ error: "Error procesando imágenes" });
  }
});

// Optional: remove a specific image by path or index
app.delete("/noticias/:id/imagenes", async (req, res) => {
  // Expect JSON: { imagePath: "..." } or { index: 0 }
  try {
    const { id } = req.params;
    const { imagePath, index } = req.body || {};
    const out = await NoticiaController.eliminarImagenBy(id, { imagePath, index });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Error eliminando imagen" });
  }
});

/* ---------------- Errors ---------------- */
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------- Export ---------------- */
export const api = functions.https.onRequest(app);
