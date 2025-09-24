import CrearNoticia from "../usecases/noticias/CrearNoticia.js";
import ActualizarNoticia from "../usecases/noticias/ActualizarNoticia.js";
import ListarNoticias from "../usecases/noticias/ListarNoticias.js";
import ObtenerNoticia from "../usecases/noticias/ObtenerNoticia.js";
import EliminarNoticia from "../usecases/noticias/EliminarNoticia.js";

import SubirImagenNoticia from "../usecases/noticias/SubirImagenNoticia.js";
import EliminarImagenNoticia from "../usecases/noticias/EliminarImagenNoticia.js";

import NoticiaRepository from "../infraestructure/adapters/NoticiaRepository.js";

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

  async listar(req, res) {
    try {
      const items = await this.listarUC.execute();
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error listando noticias" });
    }
  }

  async obtenerPorId(req, res) {
    try {
      const n = await this.obtenerUC.execute(req.params.id);
      if (!n) return res.status(404).json({ error: "Noticia no encontrada" });
      res.json(n);
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
}

export default new NoticiaController();
