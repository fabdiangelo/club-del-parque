import { setGlobalOptions } from "firebase-functions";
import * as functions from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import StorageConnection from "./src/infraestructure/ports/StorageConnection.js";

import NoticiaController from "./src/controllers/NoticiaController.js";
import UserController from "./src/controllers/UserController.js";
import AuthController from "./src/controllers/AuthController.js";
import ReporteController from "./src/controllers/ReporteController.js";
import SendWhatsappController from "./src/controllers/SendWhatsappController.js";
import EmailController from "./src/controllers/EmailController.js";

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

// Usuario
app.get("/usuario/:id", (req, res) => UserController.getUserData(req, res));
app.post("/usuario/:id/solicitud-federacion", (req, res) => UserController.solicitarFederarUsuario(req, res));

// Reportes
app.post("/reportes", (req, res) => ReporteController.crearReporte(req, res));
app.get("/reportes", (req, res) => ReporteController.obtenerReportes(req, res));

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




// Endpoint para obtener métricas de uso de Firebase
app.get('/firebase/metricas', async (req, res) => {
  try {
    // Estos son valores de ejemplo. En producción, deberías obtenerlos de:
    // 1. Firebase Usage API
    // 2. Google Cloud Monitoring API
    // 3. Firebase Admin SDK para contadores personalizados
    
    const metricas = {
      cloudFunctions: {
        usado: 125000, // Invocaciones usadas
        limite: 200000, // Límite de capa gratuita (2M invocaciones)
        porcentaje: 62.5,
        costo: 0.00 // Aún en capa gratuita
      },
      hosting: {
        usado: 8.5, // GB transferidos
        limite: 10, // Límite de capa gratuita (10 GB/mes)
        porcentaje: 85,
        costo: 0.00
      },
      firestore: {
        lecturas: {
          usado: 35000,
          limite: 50000, // 50K lecturas/día
          porcentaje: 70
        },
        escrituras: {
          usado: 15000,
          limite: 20000, // 20K escrituras/día
          porcentaje: 75
        },
        eliminaciones: {
          usado: 8000,
          limite: 20000,
          porcentaje: 40
        },
        almacenamiento: {
          usado: 0.8, // GB
          limite: 1, // 1 GB
          porcentaje: 80
        },
        costo: 0.00
      },
      gastoTotal: 0.00, // Gastos totales del mes
      periodo: {
        inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        fin: new Date().toISOString()
      }
    };

    // En producción, calcularías el porcentaje promedio de Firestore
    metricas.firestore.porcentajePromedio = 
      (metricas.firestore.lecturas.porcentaje + 
       metricas.firestore.escrituras.porcentaje + 
       metricas.firestore.eliminaciones.porcentaje + 
       metricas.firestore.almacenamiento.porcentaje) / 4;

    res.json(metricas);
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({ error: 'Error al obtener las métricas de Firebase' });
  }
});

// Endpoint para obtener reportes de usuarios
app.get('/notificaciones/obtener-reportes/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    // Simulación de datos - En producción, obtendrías esto de Firestore
    const reportesSimulados = [
      {
        id: `${idUsuario}-bug-2025-09-30T10:30:00`,
        fecha: '2025-09-30T10:30:00Z',
        leido: false,
        resumen: 'La aplicación se cierra inesperadamente al intentar subir una imagen desde la galería',
        tipo: 'bug'
      },
      {
        id: `${idUsuario}-sugerencia-2025-09-29T15:20:00`,
        fecha: '2025-09-29T15:20:00Z',
        leido: true,
        resumen: 'Sería útil tener un modo oscuro para usar la app durante la noche',
        tipo: 'sugerencia'
      },
      {
        id: `${idUsuario}-soporte-2025-09-28T09:15:00`,
        fecha: '2025-09-28T09:15:00Z',
        leido: false,
        resumen: 'No puedo restablecer mi contraseña, no me llega el correo de recuperación',
        tipo: 'soporte'
      }
    ];

    // En producción, harías algo como:
    // const reportesRef = db.collection('reportes').where('userId', '==', idUsuario);
    // const snapshot = await reportesRef.get();
    // const reportes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(reportesSimulados);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
});

// Endpoint para obtener todos los reportes (sin filtro de usuario)
app.get('/notificaciones/obtener-todos-reportes', async (req, res) => {
  try {
    const todosReportes = [
      {
        id: 'user1-bug-2025-09-30T10:30:00',
        fecha: '2025-09-30T10:30:00Z',
        leido: false,
        resumen: 'La aplicación se cierra inesperadamente al intentar subir una imagen',
        tipo: 'bug',
        usuario: 'usuario1@example.com'
      },
      {
        id: 'user2-sugerencia-2025-09-29T15:20:00',
        fecha: '2025-09-29T15:20:00Z',
        leido: true,
        resumen: 'Sería útil tener un modo oscuro',
        tipo: 'sugerencia',
        usuario: 'usuario2@example.com'
      },
      {
        id: 'user3-soporte-2025-09-28T09:15:00',
        fecha: '2025-09-28T09:15:00Z',
        leido: false,
        resumen: 'No puedo restablecer mi contraseña',
        tipo: 'soporte',
        usuario: 'usuario3@example.com'
      },
      {
        id: 'user1-bug-2025-09-27T14:00:00',
        fecha: '2025-09-27T14:00:00Z',
        leido: true,
        resumen: 'Error al cargar la lista de elementos',
        tipo: 'bug',
        usuario: 'usuario1@example.com'
      },
      {
        id: `user2-soporte-2025-09-28T09:15:00`,
        fecha: '2025-09-28T09:15:00Z',
        leido: false,
        resumen: 'El usuario Fabricio Fuentes ha solicitado federarse.          Justificante: fdsgds',
        tipo: 'solicitud_federacion',
        usuario: 'usuario4@example.com'
      }
    ];
    
    res.json(todosReportes);
  } catch (error) {
    console.error('Error al obtener todos los reportes:', error);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
});

// Endpoint para obtener cantidad de usuarios
app.get('/usuarios/cant-usuarios', async (req, res) => {
  try {
    // En producción, obtendrías esto de Firebase Auth o Firestore
    // const listUsersResult = await admin.auth().listUsers();
    // const cantidadUsuarios = listUsersResult.users.length;
    
    const cantidadUsuarios = 1247; // Valor simulado
    
    res.json({ cantidad: cantidadUsuarios });
  } catch (error) {
    console.error('Error al obtener cantidad de usuarios:', error);
    res.status(500).json({ error: 'Error al obtener la cantidad de usuarios' });
  }
});

// Endpoint para marcar reporte como leído
app.put('/notificaciones/marcar-leido/:idReporte', async (req, res) => {
  try {
    const { idReporte } = req.params;
    
    // En producción:
    // await db.collection('reportes').doc(idReporte).update({ leido: true });
    
    res.json({ success: true, message: 'Reporte marcado como leído' });
  } catch (error) {
    console.error('Error al marcar reporte:', error);
    res.status(500).json({ error: 'Error al actualizar el reporte' });
  }
});

/* ---------------- Errors ---------------- */
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------- Export ---------------- */
export const api = functions.https.onRequest(app);
