// src/controllers/NoticiaController.js

import CrearNoticia from '../usecases/noticias/CrearNoticia.js';
import ActualizarNoticia from '../usecases/noticias/ActualizarNoticia.js';
import ListarNoticias from '../usecases/noticias/ListarNoticias.js';
import ObtenerNoticia from '../usecases/noticias/ObtenerNoticia.js';
import EliminarNoticia from '../usecases/noticias/EliminarNoticia.js';

import SubirImagenNoticia from '../usecases/noticias/SubirImagenNoticia.js';
import ReemplazarImagenNoticia from '../usecases/noticias/ReemplazarImagenNoticia.js';
import EliminarImagenNoticia from '../usecases/noticias/EliminarImagenNoticia.js';

import NoticiaRepository from '../infraestructure/adapters/NoticiaRepository.js';
import NoticiaImageRepository from '../infraestructure/adapters/NoticiaImageRepository.js';

class NoticiaController {
  constructor() {
    const repo = new NoticiaRepository();
    const imgRepo = new NoticiaImageRepository();

    // keep use cases in separate fields, not clashing with method names
    this.crearUC = new CrearNoticia(repo, imgRepo);
    this.actualizarUC = new ActualizarNoticia(repo, imgRepo);
    this.listarUC = new ListarNoticias(repo);
    this.obtenerUC = new ObtenerNoticia(repo);
    this.eliminarUC = new EliminarNoticia(repo, imgRepo);

    this.subirImgUC = new SubirImagenNoticia(imgRepo);
    this.reemplazarImgUC = new ReemplazarImagenNoticia(imgRepo);
    this.eliminarImgUC = new EliminarImagenNoticia(imgRepo);
  }

  // GET /noticias
  async listar(req, res) {
    try {
      const items = await this.listarUC.execute();
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error listando noticias' });
    }
  }

  // GET /noticias/:id
  async obtenerPorId(req, res) {
    try {
      const n = await this.obtenerUC.execute(req.params.id);
      if (!n) return res.status(404).json({ error: 'Noticia no encontrada' });
      res.json(n);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error obteniendo noticia' });
    }
  }

  // POST /noticias  (multipart or JSON; if JSON, req.file undefined)
  async crear(req, res) {
    try {
      const { nombre, titulo, tipo, administradorID, mdContent } = req.body;
      const file = req.file || null;
      const id = await this.crearUC.execute(
        { nombre, titulo, tipo, administradorID, mdContent },
        file
      );
      res.status(201).json({ id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error creando noticia' });
    }
  }

  // PUT /noticias/:id  (accepts optional file)
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { nombre, titulo, tipo, administradorID, mdContent } = req.body;
      const file = req.file || null;
      await this.actualizarUC.execute(
        id,
        { nombre, titulo, tipo, administradorID, mdContent },
        file
      );
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error actualizando noticia' });
    }
  }

  // POST/PATCH /noticias/:id/image (expects multipart w/ field "imagen")
  async subirImagen(req, res) {
    try {
      const { id } = req.params;
      const file = req.file || null;
      if (!file) return res.status(400).json({ error: 'Falta imagen' });
      const out = await this.subirImgUC.execute(id, file);
      res.json(out);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error subiendo imagen' });
    }
  }

  // PATCH /noticias/:id/image (replace) – if you prefer a separate route
  async reemplazarImagen(req, res) {
    try {
      const { id } = req.params;
      const file = req.file || null;
      if (!file) return res.status(400).json({ error: 'Falta imagen' });
      const out = await this.reemplazarImgUC.execute(id, file);
      res.json(out);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error reemplazando imagen' });
    }
  }

  // DELETE /noticias/:id/image
  async eliminarImagen(req, res) {
    try {
      const { id } = req.params;
      await this.eliminarImgUC.execute(id);
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error eliminando imagen' });
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
      res.status(500).json({ error: 'Error eliminando noticia' });
    }
  }
}

export default new NoticiaController();
