// functions/src/controllers/RankingsController.js
import { RankingRepository } from "../infraestructure/adapters/RankingRepository.js";
import { RankingCategoriaRepository } from "../infraestructure/adapters/RankingCategoriaRepository.js";

const repo = new RankingRepository();
const rkCatRepo = new RankingCategoriaRepository();

/* ----------------------- utils ----------------------- */
const ok = (res, data, code = 200) => res.status(code).json(data);
const bad = (res, err, code = 400) => {
  console.error("[RankingsController]", err);
  const mensaje = err?.message || String(err);
  return res.status(code).json({ error: mensaje });
};

const S = (v) => (v == null ? "" : String(v).trim());
const L = (v) => S(v).toLowerCase();
const N = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const normalizeTipo = (tipo) => {
  const t = L(tipo);
  if (t === "singles" || t === "single") return "singles";
  if (t === "dobles" || t === "double" || t === "doubles" || t === "doble") return "dobles";
  throw new Error("tipoDePartido inválido (singles|dobles)");
};

const normalizeDeporte = (dep) => {
  if (dep == null || dep === "") return null; // deporte opcional
  const d = L(dep);
  if (d === "tenis" || d === "pádel" || d === "padel") return d === "padel" ? "padel" : "tenis";
  if (d === "padel") return "padel";
  throw new Error('deporte inválido ("tenis"|"padel")');
};

const buildDeterministicId = ({
  temporadaID,
  usuarioID,
  tipoDePartido,
  deporte,      // null | "tenis" | "padel"
  filtroId,     // null | string
}) => {
  return [
    "rk",
    L(temporadaID),
    L(usuarioID),
    normalizeTipo(tipoDePartido),
    deporte ? L(deporte) : "nodep",
    filtroId != null ? `f-${String(filtroId)}` : "nof"
  ].join("|");
};

/**
 * Valida que una ranking-categoría exista y que su scope coincida con el del ranking
 * (temporadaID, deporte, tipoDePartido y filtroId)
 * Devuelve la categoría encontrada (plain object) o lanza error.
 */
const validateCategoriaScope = async ({ categoriaId, temporadaID, deporte, tipoDePartido, filtroId }) => {
  if (categoriaId == null) return null; // permitir rankings sin categoría si lo deseás
  const cat = await rkCatRepo.findById(String(categoriaId));
  if (!cat) throw new Error("categoriaId no existe");

  const sameScope =
    S(cat.temporadaID) === S(temporadaID) &&
    L(cat.deporte) === L(deporte) &&
    L(cat.tipoDePartido) === normalizeTipo(tipoDePartido) &&
    (cat.filtroId == null ? filtroId == null : S(cat.filtroId) === S(filtroId));

  if (!sameScope) {
    throw new Error("categoriaId pertenece a otro scope (temporada/deporte/tipo/filtro) distinto");
  }
  return cat;
};

/**
 * Busca el puntaje default para un jugador que entra a una categoría:
 * - Toma la categoría inmediata inferior (peor) por `orden` dentro de este scope.
 * - Devuelve los puntos del TOP player de esa categoría (o 0 si no hay).
 * Nota: orden 0 = mejor (jerarquía ascendente).
 */
const getDefaultPointsForCategoriaAssignment = async ({
  temporadaID,
  deporte,
  tipoDePartido,
  filtroId,          // puede ser null
  categoriaIdActual, // la categoría a la que entra
}) => {
  // 1) leer la categoría actual
  const catActual = await rkCatRepo.findById(String(categoriaIdActual));
  if (!catActual) return 0;

  // 2) listar categorías del scope, encontrar la inmediata inferior (orden + 1)
  const catsScope = await rkCatRepo.getByScope({
    temporadaID: S(temporadaID),
    deporte: normalizeDeporte(deporte),
    tipoDePartido: normalizeTipo(tipoDePartido),
    filtroId: filtroId ?? null,
  });

  const inferior = catsScope.find((c) => Number(c.orden) === Number(catActual.orden) + 1);
  if (!inferior) return 0;

  // 3) leer rankings del scope y filtrar por categoriaId = inferior.id, obtener máximo de puntos
  let ranks = await repo.getAll();
  ranks = ranks.filter((r) =>
    S(r.temporadaID) === S(temporadaID) &&
    L(r.tipoDePartido) === normalizeTipo(tipoDePartido) &&
    (deporte == null ? r.deporte == null : L(r.deporte) === normalizeDeporte(deporte)) &&
    (filtroId == null ? r.filtroId == null : S(r.filtroId) === S(filtroId)) &&
    S(r.categoriaId) === S(inferior.id)
  );

  if (!ranks.length) return 0;
  const top = ranks.reduce((acc, r) => (N(r.puntos, 0) > N(acc.puntos, 0) ? r : acc), ranks[0]);
  return N(top.puntos, 0);
};

/* ----------------------- handlers ----------------------- */

const crear = async (req, res) => {
  try {
    const {
      temporadaID,
      usuarioID,
      tipoDePartido,    // "singles" | "dobles" (requerido)
      deporte,          // opcional: "tenis" | "padel" | null
      puntos = undefined, // si es undefined y hay categoriaId => usamos default segun categoria inferior
      categoriaId = null,
      filtroId = null,  // FK simple, NO snapshot
    } = req.body || {};

    if (!S(temporadaID) || !S(usuarioID) || !S(tipoDePartido)) {
      throw new Error("Faltan campos obligatorios: temporadaID, usuarioID, tipoDePartido");
    }

    const tipo = normalizeTipo(tipoDePartido);
    const dep = normalizeDeporte(deporte);

    // Validar categoría (si se envía) y consistencia de scope
    await validateCategoriaScope({
      categoriaId,
      temporadaID,
      deporte: dep,
      tipoDePartido: tipo,
      filtroId,
    });

    // Upsert por (usuario, temporada, tipo, deporte, filtroId)
    const existing = await repo.getByUsuarioTemporadaTipo(
      S(usuarioID),
      S(temporadaID),
      tipo,
      dep || undefined,
      filtroId != null ? String(filtroId) : undefined
    );

    const now = new Date().toISOString();

    // Si existe, actualizamos
    if (existing) {
      const patch = {
        updatedAt: now,
      };
      if (puntos !== undefined) patch.puntos = N(puntos, 0);
      if (categoriaId !== undefined) patch.categoriaId = categoriaId ?? null;
      if (dep != null) patch.deporte = dep;
      if (filtroId !== undefined) patch.filtroId = filtroId ?? null;

      await repo.update(existing.id, patch);
      const updated = await repo.findById(existing.id);
      return ok(res, updated, 200);
    }

    // Calcular puntos por default si entra con categoría y no vino "puntos"
    let initialPoints = 0;
    if (categoriaId != null && puntos === undefined) {
      initialPoints = await getDefaultPointsForCategoriaAssignment({
        temporadaID,
        deporte: dep,
        tipoDePartido: tipo,
        filtroId,
        categoriaIdActual: categoriaId,
      });
    } else {
      initialPoints = N(puntos, 0);
    }

    const id = buildDeterministicId({
      temporadaID,
      usuarioID,
      tipoDePartido: tipo,
      deporte: dep,
      filtroId,
    });

    const doc = {
      id,
      temporadaID: S(temporadaID),
      usuarioID: S(usuarioID),
      tipoDePartido: tipo,
      deporte: dep, // null | "tenis" | "padel"
      puntos: initialPoints,
      categoriaId: categoriaId ?? null,
      filtroId: filtroId ?? null,
      filtrosSnapshot: null, // eliminado el snapshot, dejamos en null
      partidosGanados: 0,
      partidosPerdidos: 0,
      partidosAbandonados: 0,
      createdAt: now,
      updatedAt: now,
    };

    await repo.save(doc);
    return ok(res, doc, 201);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const listar = async (req, res) => {
  try {
    const { temporadaID, tipoDePartido, deporte, leaderboard, filtroId } = req.query || {};

    // Leaderboard con agregaciones/orden (sin construir "Filtros")
    if (L(leaderboard) === "true") {
      const rows = await repo.getLeaderboard({
        temporadaID: temporadaID ? S(temporadaID) : undefined,
        tipoDePartido: tipoDePartido ? normalizeTipo(tipoDePartido) : undefined,
        deporte: deporte ? normalizeDeporte(deporte) : undefined,
        filtroId: filtroId != null ? String(filtroId) : undefined,
        limit: 2000,
      });
      return ok(res, rows, 200);
    }

    // Listado “plano” con filtros básicos
    let rows = await repo.getAll();
    if (temporadaID) rows = rows.filter((r) => S(r.temporadaID) === S(temporadaID));
    if (tipoDePartido) rows = rows.filter((r) => L(r.tipoDePartido) === normalizeTipo(tipoDePartido));
    if (deporte) {
      const dep = normalizeDeporte(deporte);
      rows = rows.filter((r) => (dep == null ? r.deporte == null : L(r.deporte) === dep));
    }
    if (filtroId != null) rows = rows.filter((r) => S(r.filtroId) === S(filtroId));

    return ok(res, rows, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await repo.findById(id);
    if (!row) return bad(res, new Error("Ranking no encontrado"), 404);
    return ok(res, row, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const editar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      puntos,
      categoriaId,
      filtroId = undefined,  // set directo (incl. null)
      temporadaID,           // opcional (no recomendado)
      tipoDePartido,
      deporte,
      ...rest
    } = req.body || {};

    const patch = { updatedAt: new Date().toISOString() };

    if (puntos !== undefined) patch.puntos = N(puntos, 0);

    // Counters
    if (rest.partidosGanados != null) patch.partidosGanados = N(rest.partidosGanados, 0);
    if (rest.partidosPerdidos != null) patch.partidosPerdidos = N(rest.partidosPerdidos, 0);
    if (rest.partidosAbandonados != null) patch.partidosAbandonados = N(rest.partidosAbandonados, 0);

    // Cambios de scope NO recomendados; si los activás, normalizá:
    if (tipoDePartido != null) patch.tipoDePartido = normalizeTipo(tipoDePartido);
    if (deporte !== undefined) patch.deporte = normalizeDeporte(deporte);
    if (temporadaID != null) patch.temporadaID = S(temporadaID);

    // FiltroId directo (sin snapshots)
    if (filtroId !== undefined) patch.filtroId = filtroId ?? null;

    // Si cambia categoría, validar contra scope resultante
    if (categoriaId !== undefined) {
      const current = await repo.findById(id);
      if (!current) throw new Error("Ranking no encontrado");

      const scope = {
        temporadaID: patch.temporadaID ?? current.temporadaID,
        deporte: patch.deporte !== undefined ? patch.deporte : current.deporte,
        tipoDePartido: patch.tipoDePartido ?? current.tipoDePartido,
        filtroId: patch.filtroId !== undefined ? patch.filtroId : current.filtroId,
      };

      await validateCategoriaScope({
        categoriaId: categoriaId,
        temporadaID: scope.temporadaID,
        deporte: scope.deporte,
        tipoDePartido: scope.tipoDePartido,
        filtroId: scope.filtroId,
      });

      patch.categoriaId = categoriaId ?? null;

      // Si el ranking no tenía puntos definidos en el body y se está asignando una categoría por 1ª vez,
      // podemos autoajustar puntos por default (opcional). Para no sorprender, solo si "puntos" es undefined:
      if (puntos === undefined && categoriaId != null && (current.categoriaId == null)) {
        const auto = await getDefaultPointsForCategoriaAssignment({
          temporadaID: scope.temporadaID,
          deporte: scope.deporte,
          tipoDePartido: scope.tipoDePartido,
          filtroId: scope.filtroId,
          categoriaIdActual: categoriaId,
        });
        patch.puntos = N(auto, 0);
      }
    }

    await repo.update(id, patch);
    const updated = await repo.findById(id);
    return ok(res, updated, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const ajustar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      delta = 0,
      deltaGanados = 0,
      deltaPerdidos = 0,
      deltaAbandonados = 0,
    } = req.body || {};

    if (typeof repo.adjustMany === "function") {
      await repo.adjustMany(id, {
        puntos: N(delta, 0),
        partidosGanados: N(deltaGanados, 0),
        partidosPerdidos: N(deltaPerdidos, 0),
        partidosAbandonados: N(deltaAbandonados, 0),
      });
    } else {
      if (delta) await repo.adjustPoints(id, N(delta));
      if (deltaGanados) await repo.adjustCounter?.(id, "partidosGanados", N(deltaGanados));
      if (deltaPerdidos) await repo.adjustCounter?.(id, "partidosPerdidos", N(deltaPerdidos));
      if (deltaAbandonados) await repo.adjustCounter?.(id, "partidosAbandonados", N(deltaAbandonados));
    }

    const updated = await repo.findById(id);
    return ok(res, updated, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const reset = async (req, res) => {
  try {
    const { id } = req.params;
    await repo.update(id, {
      puntos: 0,
      partidosGanados: 0,
      partidosPerdidos: 0,
      partidosAbandonados: 0,
      updatedAt: new Date().toISOString(),
    });
    const updated = await repo.findById(id);
    return ok(res, updated, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await repo.delete(id);
    return ok(res, { id, eliminado: true }, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

/* ----- helpers explícitos de filtroId (sin snapshots) ----- */
const asignarFiltro = async (req, res) => {
  try {
    const { id } = req.params; // rankingId
    const { filtroId } = req.body || {};
    await repo.update(id, { filtroId: filtroId ?? null, filtrosSnapshot: null, updatedAt: new Date().toISOString() });
    const updated = await repo.findById(id);
    return ok(res, updated, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const quitarFiltro = async (req, res) => {
  try {
    const { id } = req.params; // rankingId
    await repo.update(id, { filtroId: null, filtrosSnapshot: null, updatedAt: new Date().toISOString() });
    const updated = await repo.findById(id);
    return ok(res, updated, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};

export default {
  crear,
  listar,
  getById,
  editar,
  ajustar,
  reset,
  eliminar,
  asignarFiltro,
  quitarFiltro,
};
