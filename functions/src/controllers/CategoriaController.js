import { CategoriaRepository } from "../infraestructure/adapters/CategoriaRepository.js";

const CAP_OK = new Set([4, 8, 16, 32, 64, 128, 256]);

class CategoriaController {
  constructor() {
    this.repo = new CategoriaRepository();
  }

  async crearCategoria(req, res) {
    try {
      const { nombre, capacidad } = req.body || {};
      if (!nombre || !String(nombre).trim()) throw new Error("nombre obligatorio");
      const cap = Number(capacidad);
      if (!Number.isInteger(cap) || cap < 4 || !CAP_OK.has(cap))
        throw new Error("capacidad inválida (4,8,16,32,64,128,256)");

      const all = await this.repo.getAll();
      const orden = all.length; // new goes to the end by default
      const id = await this.repo.save({ nombre: String(nombre).trim(), capacidad: cap, orden });
      res.status(201).json({ id });
    } catch (e) {
      res.status(400).json({ error: e?.message || String(e) });
    }
  }

  async getAllCategorias(_req, res) {
    try {
      const cats = await this.repo.getAll();
      cats.sort((a, b) => (a.orden - b.orden) || (a?.nombre || "").localeCompare(b?.nombre || ""));
      res.json(cats);
    } catch (e) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  async getById(req, res) {
    try {
      const cat = await this.repo.getById(req.params.id);
      if (!cat) return res.status(404).json({ error: "Categoría no encontrada" });
      res.json(cat);
    } catch (e) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  async actualizarCategoria(req, res) {
    try {
      const { id } = req.params;
      const partial = {};
      if ("nombre" in req.body) {
        const n = String(req.body.nombre || "").trim();
        if (!n) throw new Error("nombre obligatorio");
        partial.nombre = n;
      }
      if ("capacidad" in req.body) {
        const cap = Number(req.body.capacidad);
        if (!Number.isInteger(cap) || cap < 4 || !CAP_OK.has(cap))
          throw new Error("capacidad inválida (4,8,16,32,64,128,256)");
        partial.capacidad = cap;
      }
      if ("orden" in req.body) {
        const o = Number(req.body.orden);
        if (!Number.isInteger(o) || o < 0) throw new Error("orden inválido");
        partial.orden = o;
      }
      const updated = await this.repo.updatePartial(id, partial);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e?.message || String(e) });
    }
  }

  async eliminarCategoria(req, res) {
    try {
      await this.repo.delete(req.params.id);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }

  /**
   * PATCH /categorias/orden
   * Body: ["idTop","idNext",...]  (best -> worst)
   * We set orden = index. IDs not included will be appended after, preserving their relative order.
   */
  async setOrden(req, res) {
    try {
      const ids = req.body;
if (!Array.isArray(ids)) {
  throw new Error("Body debe ser un array de ids");
}

for (const id of ids) {
  if (typeof id !== "string" || id === "orden" || !id.trim()) {
    throw new Error(`ID inválido en body: ${id}`);
  }
}



      const current = await this.repo.getAll();
      const currentIds = current.map(c => c.id);
      const set = new Set(ids);
      // validate
      for (const id of ids) {
        if (!currentIds.includes(id)) throw new Error(`ID inexistente: ${id}`);
      }

      // build final order: provided ids first (index), then remaining
      const remainder = currentIds.filter(id => !set.has(id));
      const final = [...ids, ...remainder];

      // apply sequentially
      await this.repo.applyOrder(final.map((id, idx) => ({ id, orden: idx })));
      res.json({ ok: true, total: final.length });
    } catch (e) {
      res.status(400).json({ error: e?.message || String(e) });
    }
  }
}

export default new CategoriaController();
