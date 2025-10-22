// functions/src/controllers/RankingCategoriasController.js
import RankingCategoria from "../domain/entities/RankingCategoria.js";
import { RankingCategoriaRepository } from "../infraestructure/adapters/RankingCategoriaRepository.js";

const repo = new RankingCategoriaRepository();

const ok = (res, data, code = 200) => res.status(code).json(data);
const bad = (res, err, code = 400) => {
  console.error("[RankingCategoriasController]", err);
  const mensaje = err?.message || String(err);
  return res.status(code).json({ error: mensaje });
};

const s = (v) => (v == null ? "" : String(v));

/** Normaliza el scope desde req.query/req.body sin perder "0" */
function parseScopeFrom(obj = {}) {
  const temporadaID = s(obj.temporadaID);
  const deporte = s(obj.deporte).toLowerCase();
  const tipoDePartido = s(obj.tipoDePartido).toLowerCase();
  const hasFiltro = Object.prototype.hasOwnProperty.call(obj, "filtroId");
  // si no vino, es null; si vino (incluso "" o "0"), se respeta tal cual string
  const filtroId = hasFiltro ? s(obj.filtroId) : null;
  return { temporadaID, deporte, tipoDePartido, filtroId, hasFiltro };
}

class RankingCategoriasController {
  async crear(req, res) {
    try {
      const payload = req.body || {};
      const entity = new RankingCategoria({
        id: payload.id ?? null,
        temporadaID: s(payload.temporadaID),
        deporte: s(payload.deporte).toLowerCase(),
        tipoDePartido: s(payload.tipoDePartido).toLowerCase(),
        filtroId: Object.prototype.hasOwnProperty.call(payload, "filtroId")
          ? s(payload.filtroId)
          : null,
        nombre: s(payload.nombre),
        capacidad: Number(payload.capacidad),
        orden: Number.isInteger(payload.orden) ? payload.orden : 0,
      }).toPlainObject();

      // ID estable (incluye filtroId, usando "null" si el valor es null)
      const id =
        entity.id ||
        [
          s(entity.temporadaID).toLowerCase(),
          s(entity.deporte).toLowerCase(),
          s(entity.tipoDePartido).toLowerCase(),
          (entity.filtroId == null ? "null" : s(entity.filtroId)).toLowerCase(),
          s(entity.nombre).toLowerCase().replace(/\s+/g, "-"),
        ]
          .filter((x) => x !== "") // no borres "null"
          .join("|");

      entity.id = id;
      await repo.save(entity);
      return ok(res, entity, 201);
    } catch (e) {
      return bad(res, e, 400);
    }
  }

  async listar(req, res) {
    try {
      const { temporadaID, deporte, tipoDePartido, filtroId, hasFiltro } =
        parseScopeFrom(req.query || {});

      // Listado por scope
      if (temporadaID && deporte && tipoDePartido) {
        const rows = await repo.getByScope({
          temporadaID,
          deporte,
          tipoDePartido,
          filtroId: hasFiltro ? filtroId : null,
        });
        return ok(res, rows, 200);
      }

      // Listado completo
      const rows = await repo.getAll();
      rows.sort(
        (a, b) =>
          s(a.temporadaID).localeCompare(s(b.temporadaID)) ||
          s(a.deporte).localeCompare(s(b.deporte)) ||
          s(a.tipoDePartido).localeCompare(s(b.tipoDePartido)) ||
          Number(a.orden) - Number(b.orden) ||
          s(a.nombre).localeCompare(s(b.nombre))
      );
      return ok(res, rows, 200);
    } catch (e) {
      return bad(res, e, 400);
    }
  }

  async getById(req, res) {
    try {
      const row = await repo.findById(req.params.id);
      if (!row) return bad(res, new Error("No encontrado"), 404);
      return ok(res, row, 200);
    } catch (e) {
      return bad(res, e, 400);
    }
  }

  async editar(req, res) {
    try {
      const { id } = req.params;
      const patch = {};
      const body = req.body || {};
      const CAP_OK = new Set([4, 8, 16, 32, 64, 128, 256]);

      if ("nombre" in body) {
        const nm = s(body.nombre);
        if (!nm) throw new Error("nombre obligatorio");
        patch.nombre = nm;
      }
      if ("capacidad" in body) {
        const cap = Number(body.capacidad);
        if (!Number.isInteger(cap) || !CAP_OK.has(cap))
          throw new Error("capacidad inválida (4,8,16,32,64,128,256)");
        patch.capacidad = cap;
      }
      if ("orden" in body) {
        const ord = Number(body.orden);
        if (!Number.isInteger(ord) || ord < 0) throw new Error("orden inválido");
        patch.orden = ord;
      }
      if ("filtroId" in body) {
        patch.filtroId = body.filtroId == null ? null : s(body.filtroId);
      }

      const updated = await repo.updatePartial(id, patch);
      return ok(res, updated, 200);
    } catch (e) {
      return bad(res, e, 400);
    }
  }

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      await repo.delete(id);
      return res.status(204).send();
    } catch (e) {
      return bad(res, e, 400);
    }
  }

  /**
   * PATCH /ranking-categorias/orden
   * Body:
   * {
   *   temporadaID: string,
   *   deporte: "tenis"|"padel",
   *   tipoDePartido: "singles"|"dobles",
   *   filtroId?: string|null,   // si no viene, es null; si viene "" o "0", se respeta
   *   ids: ["id1","id2",...]
   * }
   */
  async setOrden(req, res) {
    try {
      const { temporadaID, deporte, tipoDePartido, filtroId, hasFiltro } =
        parseScopeFrom(req.body || {});
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : undefined;

      if (!temporadaID || !deporte || !tipoDePartido)
        throw new Error(
          "Falta algún campo del scope (temporadaID,deporte,tipoDePartido)"
        );
      if (!Array.isArray(ids)) throw new Error("ids debe ser array");

      // 1) Leemos el scope actual para validar IDs y tener orden previo
      const scopeRows = await repo.getByScope({
        temporadaID,
        deporte,
        tipoDePartido,
        filtroId: hasFiltro ? filtroId : null,
      });

      const scopeIds = scopeRows.map((r) => r.id);
      for (const id of ids) {
        if (!scopeIds.includes(id)) {
          throw new Error(`ID fuera de scope: ${id}`);
        }
      }

      // 2) Agregamos al final los que no vinieron (para no perder ninguno)
      const given = new Set(ids);
      const finalIds = [...ids, ...scopeIds.filter((id) => !given.has(id))];

      // 3A) MODO REINDEX (recomendado): asignar 0..n según el array final
      const patches = finalIds.map((id, idx) =>
        repo.updatePartial(id, { orden: Number(idx) })
      );
      await Promise.all(patches);

      /* 3B) --- MODO "SWAP-ONLY" (alternativo) ---
         Si preferís sólo intercambiar dos posiciones y dejar el resto igual,
         comentá el bloque 3A de arriba y descomentá este.
         Nota: requiere detectar cuál se movió.
      */
      // const oldIndex = new Map(scopeRows.map((r) => [r.id, Number(r.orden)]));
      // const newIndex = new Map(finalIds.map((id, i) => [id, i]));
      // // detectar moved (los que cambian de posición)
      // const moved = finalIds.filter((id) => oldIndex.get(id) !== newIndex.get(id));
      // if (moved.length === 2) {
      //   // caso típico “subí uno al tope”: swap entre ambos
      //   const [a, b] = moved;
      //   await Promise.all([
      //     repo.updatePartial(a, { orden: newIndex.get(a) }),
      //     repo.updatePartial(b, { orden: newIndex.get(b) }),
      //   ]);
      // } else {
      //   // si hay más de 2 movidos, reindex completo (fallback más robusto)
      //   const patchesSwap = finalIds.map((id, idx) =>
      //     repo.updatePartial(id, { orden: Number(idx) })
      //   );
      //   await Promise.all(patchesSwap);
      // }

      // 4) Re-leer y devolver filas ya ordenadas
      const rows = await repo.getByScope({
        temporadaID,
        deporte,
        tipoDePartido,
        filtroId: hasFiltro ? filtroId : null,
      });

      return ok(
        res,
        {
          ok: true,
          total: finalIds.length,
          ids: finalIds,
          rows,
        },
        200
      );
    } catch (e) {
      return bad(res, e, 400);
    }
  }
}

export default new RankingCategoriasController();
