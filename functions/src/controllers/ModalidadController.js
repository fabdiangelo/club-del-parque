import ModalidadRepository from "../infraestructure/adapters/ModalidadRepository.js";

const repo = new ModalidadRepository();

export default class ModalidadController {
  static async getAll(_req, res) {
    try {
      const list = await repo.getAll();
      res.json(list);
    } catch (e) {
      console.error("[GET /modalidades] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  static async create(req, res) {
    try {
      const out = await repo.create(req.body?.nombre);
      res.status(201).json(out);
    } catch (e) {
      const msg = String(e?.message || e);
      const code = /obligatorio|existe|inválid/.test(msg) ? 400 : 500;
      console.error("[POST /modalidades] ERROR:", e);
      res.status(code).json({ error: msg });
    }
  }

  static async delete(req, res) {
    try {
      await repo.delete(req.params.nombre);
      res.status(204).send();
    } catch (e) {
      console.error("[DELETE /modalidades/:nombre] ERROR:", e);
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
}
