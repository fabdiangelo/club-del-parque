import FiltrosRepository from "../infraestructure/adapters/FiltrosRepository.js";
const repo = new FiltrosRepository();

export default class FiltrosController {
  static async getAll(_req, res) {
    try {
      const list = await repo.getAll();
      res.json(list);
    } catch (e) {
      console.error("[GET /filtros] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  static async getById(req, res) {
    try {
      const item = await repo.getById(req.params.id);
      if (!item) return res.status(404).json({ error: "No encontrado" });
      res.json(item);
    } catch (e) {
      console.error("[GET /filtros/:id] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  static async create(req, res) {
    try {
      const out = await repo.create(req.body || {});
      res.status(201).json(out);
    } catch (e) {
      const msg = String(e?.message || e);
      const code = /obligatorio|inválid|no puede/.test(msg) ? 400 : 500;
      console.error("[POST /filtros] ERROR:", e);
      res.status(code).json({ error: msg });
    }
  }

  static async update(req, res) {
    try {
      const out = await repo.update(req.params.id, req.body || {});
      if (!out) return res.status(404).json({ error: "No encontrado" });
      res.json(out);
    } catch (e) {
      const msg = String(e?.message || e);
      const code = /obligatorio|inválid|no puede|no encontrado/.test(msg) ? 400 : 500;
      console.error("[PATCH /filtros/:id] ERROR:", e);
      res.status(code).json({ error: msg });
    }
  }

  static async delete(req, res) {
    try {
      await repo.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      console.error("[DELETE /filtros/:id] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
}
