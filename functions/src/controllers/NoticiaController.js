// src/controllers/NoticiaController.js
import CrearNoticia from "../usecases/noticias/CrearNoticia.js";
import ActualizarNoticia from "../usecases/noticias/ActualizarNoticia.js";
import ListarNoticias from "../usecases/noticias/ListarNoticias.js";
import ObtenerNoticia from "../usecases/noticias/ObtenerNoticia.js";
import EliminarNoticia from "../usecases/noticias/EliminarNoticia.js";

import SubirImagenNoticia from "../usecases/noticias/SubirImagenNoticia.js";
import EliminarImagenNoticia from "../usecases/noticias/EliminarImagenNoticia.js";

import NoticiaRepository from "../infraestructure/adapters/NoticiaRepository.js";

/* ---------- date helpers (normalize to ISO + optional pretty) ---------- */
function tsToIso(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();    // Firestore Timestamp
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000).toISOString(); // emulator/REST
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v).toISOString();   // epoch s/ms
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function fmtDateIso(iso, locale = "es-UY") {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Montevideo", // opcional: fija TZ
  });
}

function formatNoticiaOut(n) {
  const plain = typeof n.toPlainObject === "function" ? n.toPlainObject() : { ...n };

  // Normalize core dates -> ISO strings (overwrite original)
  const fcIso = tsToIso(plain.fechaCreacion);
  const faIso = tsToIso(plain.fechaActualizacion);

  // Normalize nested images too
  const imagenes = Array.isArray(plain.imagenes)
    ? plain.imagenes.map((it) => {
        const upIso = tsToIso(it.uploadedAt);
        return {
          ...it,
          uploadedAt: upIso,                // ISO string
          uploadedAtFmt: fmtDateIso(upIso), // pretty
        };
      })
    : [];

  return {
    ...plain,
    fechaCreacion: fcIso,                       // ISO string now
    fechaActualizacion: faIso,                  // ISO string now
    fechaCreacionFmt: fmtDateIso(fcIso),        // pretty string (optional)
    fechaActualizacionFmt: fmtDateIso(faIso),   // pretty string (optional)
    imagenes,
  };
}

class NoticiaController {
  constructor() {
    const repo = new NoticiaRepository();

    this.crearUC = new CrearNoticia(repo);
    this.actualizarUC = new ActualizarNoticia(repo);
    this.listarUC = new ListarNoticias(repo);
    this.obtenerUC = new ObtenerNoticia(repo);
    this.eliminarUC = new EliminarNoticia(repo);
    this.subirImgUC = new SubirImagenNoticia(repo);
    this.eliminarImgUC = new EliminarImagenNoticia(repo);
    this.repo = repo;
  }

  /* ------------ CRUD JSON ------------ */
  async listar(_req, res) {
    try {
      const items = await this.listarUC.execute();
      res.json(items.map(formatNoticiaOut));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error listando noticias" });
    }
  }

  async obtenerPorId(req, res) {
    try {
      const n = await this.obtenerUC.execute(req.params.id);
      if (!n) return res.status(404).json({ error: "Noticia no encontrada" });
      res.json(formatNoticiaOut(n));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error obteniendo noticia" });
    }
  }

  async crear(req, res) {
    try {
      const { nombre, titulo, tipo, administradorID, mdContent } = req.body || {};
      const id = await this.crearUC.execute(
        { nombre, titulo, tipo, administradorID, mdContent },
        null
      );
      res.status(201).json({ id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error creando noticia" });
    }
  }

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, titulo, tipo, administradorID, mdContent } = req.body || {};
      await this.actualizarUC.execute(
        id,
        { nombre, titulo, tipo, administradorID, mdContent },
        null,
        {}
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error actualizando noticia" });
    }
  }

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      await this.eliminarUC.execute(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error eliminando noticia" });
    }
  }

  /* ------------ images (multi) ------------ */
  async subirImagenes(id, images) {
    try {
      const added = [];
      for (const img of images) {
        const out = await this.repo.addImage(id, {
          imageBuffer: img.buffer,
          fileName: img.originalname,
          contentType: img.mimetype,
        });
        added.push(out);
      }
      return { added };
    } catch (e) {
      console.error(e);
      throw new Error("Error subiendo imágenes");
    }
  }

  async eliminarImagenBy(id, ref) {
    try {
      const ok = await this.repo.removeImageBy(id, ref);
      return { ok };
    } catch (e) {
      console.error(e);
      throw new Error("Error eliminando imagen");
    }
  }
}

export default new NoticiaController();
