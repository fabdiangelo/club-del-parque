import CrearNoticia from "../usecases/noticias/CrearNoticia.js";
import ActualizarNoticia from "../usecases/noticias/ActualizarNoticia.js";
import ListarNoticias from "../usecases/noticias/ListarNoticias.js";
import ObtenerNoticia from "../usecases/noticias/ObtenerNoticia.js";
import EliminarNoticia from "../usecases/noticias/EliminarNoticia.js";

import SubirImagenNoticia from "../usecases/noticias/SubirImagenNoticia.js";
import EliminarImagenNoticia from "../usecases/noticias/EliminarImagenNoticia.js";

import NoticiaRepository from "../infraestructure/adapters/NoticiaRepository.js";

/* ---------- date helpers  ---------- */
function tsToIso(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();                  
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000).toISOString();   
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v).toISOString();    
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
    timeZone: "America/Montevideo",
  });
}

function formatNoticiaOut(n) {
  const plain = typeof n.toPlainObject === "function" ? n.toPlainObject() : { ...n };
  const fcIso = tsToIso(plain.fechaCreacion);
  const faIso = tsToIso(plain.fechaActualizacion);

  const imagenes = Array.isArray(plain.imagenes)
    ? plain.imagenes.map((it) => {
        const upIso = tsToIso(it.uploadedAt);
        return { ...it, uploadedAt: upIso, uploadedAtFmt: fmtDateIso(upIso) };
      })
    : [];

  return {
    ...plain,
    fechaCreacion: fcIso,
    fechaActualizacion: faIso,
    fechaCreacionFmt: fmtDateIso(fcIso),
    fechaActualizacionFmt: fmtDateIso(faIso),
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

  async subirImagenesID(req, res) {
    try {
      try {
        req.setTimeout(0);
      } catch {}
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
      const added = [];
      for (let i = 0; i < normalized.length; i++) {
        const img = normalized[i];
        const out = await this.repo.addImage(id, {
          imageBuffer: img.buffer,
          fileName: img.originalname,
          contentType: img.mimetype,
        });
        console.log(`[save] ${id} #${i} ok -> ${out.imagePath}`);
        added.push(out);
      }
      return res.json({added});
    } catch (err) {
      const msg = err?.message || String(err);
      console.error("imagenes-json ERROR:", msg);
      if (/noticia not found/i.test(msg))
        return res.status(404).json({ error: msg });
      if (/too large|entity too large|payload too large/i.test(msg)) {
        return res.status(413).json({ error: "Payload demasiado grande" });
      }
      return res.status(400).json({ error: msg });
    }
  }

  async eliminarImagenID(req, res) {
    try {
      const { id, index: idxParam } = req.params;
      let index = typeof idxParam !== "undefined" ? Number(idxParam) : undefined;
      const imagePath =
        req.query.imagePath ||
        (req.body && typeof req.body.imagePath === "string"
          ? req.body.imagePath
          : undefined);

      if (typeof index === "number" && Number.isFinite(index)) {
      } else if (imagePath) {
        index = undefined;
      } else if (req.body && typeof req.body.index === "number") {
        index = req.body.index;
      } else {
        return res.status(400).json({ error: "Provide imagePath or index" });
      }
      const ref = typeof index === "number" ? { index } : { imagePath };
      const out = await this.repo.removeImageBy(id, ref);
      if (!out?.ok)
        return res.status(404).json({ error: "Imagen no encontrada" });
      res.json({ ok: true });
    } catch (e) {
      console.error("DEL imagen error:", e);
      res.status(400).json({ error: e?.message || "Error eliminando imagen" });
    }
  }
}

export default new NoticiaController();
