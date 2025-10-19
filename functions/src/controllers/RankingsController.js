// /functions/src/controllers/RankingsController.js
import ObtenerRanking from "../usecases/Rankings/ObtenerRanking.js";
import ListarRankings from "../usecases/Rankings/ListarRankings.js";
import EditarRanking from "../usecases/Rankings/EditarRanking.js";
import AjustarPuntos from "../usecases/Rankings/AjustarPuntos.js";
import ResetPuntos from "../usecases/Rankings/ResetPuntos.js";
import EliminarRanking from "../usecases/Rankings/EliminarRanking.js";
import GetActualUser from "../usecases/Auth/GetActualUser.js";

function requireAdmin(req) {
  const sessionCookie = req.cookies?.session || "";
  if (!sessionCookie) throw new Error("No session cookie found");
  const user = GetActualUser.execute(sessionCookie);
  if (user?.rol !== "administrador") throw new Error("Acceso no autorizado");
}

class RankingsController {
  async getById(req, res) {
    try {
      const { id } = req.params;
      const r = await ObtenerRanking.execute(id);
      res.json(r);
    } catch (e) {
      res.status(404).json({ error: e?.message || "Ranking no encontrado" });
    }
  }

  async listar(req, res) {
    try {
      const { temporadaID, usuarioID, tipoDePartido, leaderboard, limit, deporte } = req.query;
      const out = await ListarRankings.execute({
        temporadaID: temporadaID || undefined,
        usuarioID: usuarioID || undefined,
        tipoDePartido: tipoDePartido || undefined,
        deporte: (deporte || "").trim() || undefined,  // ← OPTIONAL
        leaderboard: leaderboard === "true",
        limit: limit ? Number(limit) : undefined,
      });
      res.json(out);
    } catch (e) {
      res.status(400).json({ error: e?.message || String(e) });
    }
  }

  async editar(req, res) {
    try {
      requireAdmin(req);
      const { id } = req.params;
      await EditarRanking.execute(id, req.body || {});
      res.json({ ok: true });
    } catch (e) {
      res.status(/autorizado|session/i.test(e?.message) ? 401 : 400).json({ error: e?.message || String(e) });
    }
  }

  async ajustar(req, res) {
    try {
      requireAdmin(req);
      const { id } = req.params;
      const { delta } = req.body || {};
      await AjustarPuntos.execute(id, Number(delta));
      res.json({ ok: true });
    } catch (e) {
      res.status(/autorizado|session/i.test(e?.message) ? 401 : 400).json({ error: e?.message || String(e) });
    }
  }

  async reset(req, res) {
    try {
      requireAdmin(req);
      const { id } = req.params;
      const { puntos = 0 } = req.body || {};
      await ResetPuntos.execute(id, Number(puntos));
      res.json({ ok: true });
    } catch (e) {
      res.status(/autorizado|session/i.test(e?.message) ? 401 : 400).json({ error: e?.message || String(e) });
    }
  }

  async eliminar(req, res) {
    try {
      requireAdmin(req);
      const { id } = req.params;
      await EliminarRanking.execute(id);
      res.json({ ok: true });
    } catch (e) {
      res.status(/autorizado|session/i.test(e?.message) ? 401 : 400).json({ error: e?.message || String(e) });
    }
  }
}

export default new RankingsController();
