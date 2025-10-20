// functions/src/controllers/DeporteController.js
import { DeporteRepository } from "../infraestructure/adapters/DeporteRepository.js";

class DeporteController {
  constructor() {
    this.repo = new DeporteRepository();
  }

  /** GET /deportes */
  async getAll(_req, res) {
    try {
      // ❌ sin seeding
      const list = await this.repo.getAll();
      res.json(list);
    } catch (e) {
      console.error("[GET /deportes] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  /** GET /deportes/:id */
  async getById(req, res) {
    try {
      const dep = await this.repo.getById(req.params.id);
      if (!dep) return res.status(404).json({ error: "Deporte no encontrado" });
      res.json(dep);
    } catch (e) {
      console.error("[GET /deportes/:id] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  /** POST /deportes  Body:{id, nombre} */
  async create(req, res) {
    try {
      const out = await this.repo.create(req.body || {});
      res.status(201).json(out);
    } catch (e) {
      console.error("[POST /deportes] ERROR:", e);
      const msg = String(e?.message || e);
      const code = /obligatorio|ya existe|inválid/.test(msg) ? 400 : 500;
      res.status(code).json({ error: msg });
    }
  }

  /** PATCH /deportes/:id  Body:{nombre?} */
  async update(req, res) {
    try {
      const out = await this.repo.update(req.params.id, req.body || {});
      res.json(out);
    } catch (e) {
      console.error("[PATCH /deportes/:id] ERROR:", e);
      const msg = String(e?.message || e);
      const code = /obligatorio|no encontrado|inválid/.test(msg) ? 400 : 500;
      res.status(code).json({ error: msg });
    }
  }

  /** DELETE /deportes/:id */
  async delete(req, res) {
    try {
      await this.repo.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error("[DELETE /deportes/:id] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
}

export default new DeporteController();
