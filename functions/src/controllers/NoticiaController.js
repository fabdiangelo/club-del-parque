// src/controllers/NoticiaController.js
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

    // Use-cases depend on INoticiaRepository interface
    this.crearUC = new CrearNoticia(repo);
    this.actualizarUC = new ActualizarNoticia(repo);
    this.listarUC = new ListarNoticias(repo);
    this.obtenerUC = new ObtenerNoticia(repo);
    this.eliminarUC = new EliminarNoticia(repo);

    // Image-only helpers now just call repo.setImage/removeImage via UCs
    this.subirImgUC = new SubirImagenNoticia(repo);
    this.eliminarImgUC = new EliminarImagenNoticia(repo);
  }

  // GET /noticias
  async listar(req, res) {
    try {
      const items = await this.listarUC.execute();
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error listando noticias" });
    }
  }

  // GET /noticias/:id
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

  // POST /noticias  (JSON or multipart; in multipart the field is "imagen")
  async crear(req, res) {
    try {
      const { nombre, titulo, tipo, administradorID, mdContent } = req.body;
      const image = req.file || null; // unified repo accepts multer file directly
      const id = await this.crearUC.execute(
        { nombre, titulo, tipo, administradorID, mdContent },
        image
      );
      res.status(201).json({ id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error creando noticia" });
    }
  }

  // PUT /noticias/:id  (multipart optional; replaces image if a file is provided)
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, titulo, tipo, administradorID, mdContent } = req.body;
      const image = req.file || null;
      await this.actualizarUC.execute(
        id,
        { nombre, titulo, tipo, administradorID, mdContent },
        image,
        { replaceImage: !!image }
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error actualizando noticia" });
    }
  }

  // POST /noticias/:id/imagen  (image-only replace/set; field "imagen")
  async subirImagen(req, res) {
    try {
      const { id } = req.params;
      const file = req.file || null;
      if (!file) return res.status(400).json({ error: "Falta imagen" });
      await this.subirImgUC.execute(id, file); // repo.setImage()
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error subiendo/reemplazando imagen" });
    }
  }

  // DELETE /noticias/:id/imagen
  async eliminarImagen(req, res) {
    try {
      const { id } = req.params;
      await this.eliminarImgUC.execute(id); // repo.removeImage()
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error eliminando imagen" });
    }
  }

  // DELETE /noticias/:id
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
