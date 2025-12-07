// Obtener el ranking con más puntos del usuario en su última temporada
import { TemporadaRepository } from "../infraestructure/adapters/TemporadaRepository.js";

const temporadaRepo = new TemporadaRepository();

// GET /rankings/usuario/:usuarioID/mejor
const getMejorRankingUltimaTemporada = async (req, res) => {
  try {
    const { usuarioID } = req.params;
    // 1. Obtener todos los rankings del usuario
    const rankings = await repo.getByUsuario(usuarioID);
    if (!rankings || rankings.length === 0) {
      return ok(res, null, 200);
    }
    // 2. Agrupar rankings por temporadaID y encontrar el de más puntos en cada temporada
    const rankingsPorTemporada = {};
    for (const r of rankings) {
      if (!r.temporadaID) continue;
      if (!rankingsPorTemporada[r.temporadaID] || Number(r.puntos || 0) > Number(rankingsPorTemporada[r.temporadaID].puntos || 0)) {
        rankingsPorTemporada[r.temporadaID] = r;
      }
    }
    // 3. Obtener todas las temporadas y ordenarlas por fecha (desc)
    const temporadas = await temporadaRepo.getAll();
    if (!temporadas || temporadas.length === 0) {
      return ok(res, null, 200);
    }
    // Ordenar temporadas por fechaInicio descendente (más reciente primero)
    temporadas.sort((a, b) => new Date(b.fechaInicio || b.fecha || 0) - new Date(a.fechaInicio || a.fecha || 0));
    // 4. Buscar la temporada más reciente en la que el usuario tenga ranking
    for (const temporada of temporadas) {
      const rk = rankingsPorTemporada[temporada.id];
      if (rk) {
        return ok(res, { ranking: rk, temporada }, 200);
      }
    }
    // Si no hay ranking en ninguna temporada existente
    return ok(res, null, 200);
  } catch (err) {
    return bad(res, err, 400);
  }
};
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

    console.log('Crear ranking con datos:', { temporadaID, usuarioID, tipo, dep, puntos, categoriaId, filtroId });

    // Buscar ranking previo del usuario en el mismo scope (para evitar dupes y copiar counters)
    // Buscar todos los rankings del usuario en el scope (ignorando categoría)
    let allRankings = await repo.getAll();
    const scopeRankings = allRankings.filter(r =>
      S(r.temporadaID) === S(temporadaID) &&
      S(r.usuarioID) === S(usuarioID) &&
      normalizeTipo(r.tipoDePartido) === tipo &&
      (dep == null ? r.deporte == null : L(r.deporte) === dep) &&
      (filtroId == null ? r.filtroId == null : S(r.filtroId) === S(filtroId))
    );

    // Si hay más de uno, elimina duplicados y conserva el primero
    let existing = scopeRankings[0] || null;
    if (scopeRankings.length > 1) {
      for (let i = 1; i < scopeRankings.length; i++) {
        await repo.delete(scopeRankings[i].id);
      }
    }

    // Si existe, actualiza el ranking
    let prevPuntos = 0, prevGanados = 0, prevPerdidos = 0, prevAbandonados = 0;
    let prevCategoriaId = null;
    if (existing) {
      prevPuntos = N(existing.puntos, 0);
      prevGanados = N(existing.partidosGanados, 0);
      prevPerdidos = N(existing.partidosPerdidos, 0);
      prevAbandonados = N(existing.partidosAbandonados, 0);
      prevCategoriaId = existing.categoriaId;
    }

    const now = new Date().toISOString();

    // Si existe, actualizamos
    if (existing) {
      const patch = {
        updatedAt: now,
      };
      if (puntos !== undefined) patch.puntos = puntos;
      if (categoriaId !== undefined) patch.categoriaId = categoriaId;
      if (dep != null) patch.deporte = dep;
      if (filtroId !== undefined) patch.filtroId = filtroId;
      // Mantener género si existe en el ranking anterior o deducir del filtro
      let genero = existing.genero;
      if (!genero && req.body.genero) genero = req.body.genero;
      if (!genero && req.body.filtrosSnapshot?.genero?.nombre) genero = req.body.filtrosSnapshot.genero.nombre;
      if (genero) patch.genero = genero;
      // Si se está cambiando de categoría, copiar partidos ganados/perdidos
      if (prevRanking) {
        patch.partidosGanados = prevGanados;
        patch.partidosPerdidos = prevPerdidos;
        patch.partidosAbandonados = prevAbandonados;
        // Si el ranking anterior tenía género, conservarlo
        if (prevRanking.genero) patch.genero = prevRanking.genero;
      }
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
    } else if (puntos !== undefined) {
      initialPoints = puntos;
    } else if (prevRanking) {
      initialPoints = prevPuntos;
    }

    // Deducir género para el nuevo ranking
    let genero = req.body.genero;
    if (!genero && req.body.filtrosSnapshot?.genero?.nombre) genero = req.body.filtrosSnapshot.genero.nombre;
    if (!genero && prevRanking?.genero) genero = prevRanking.genero;

    const id = buildDeterministicId({
      temporadaID,
      usuarioID,
      tipoDePartido: tipo,
      deporte: dep,
      filtroId,
    });

    // Crear el nuevo ranking con género incluido
    const newRanking = {
      id,
      temporadaID,
      usuarioID,
      tipoDePartido: tipo,
      deporte: dep,
      filtroId,
      categoriaId,
      puntos: initialPoints,
      partidosGanados: prevGanados,
      partidosPerdidos: prevPerdidos,
      partidosAbandonados: prevAbandonados,
      updatedAt: now,
      genero,
    };
    await repo.save(newRanking);
  } catch (err) {
    return bad(res, err, 400);
  }
};

const listar = async (req, res) => {
  try {
    const { temporadaID, tipoDePartido, deporte, leaderboard, filtroId } = req.query || {};
    console.log('Listar rankings con filtros:', { temporadaID, tipoDePartido, deporte, leaderboard, filtroId });
    // Leaderboard con agregaciones/orden (sin construir "Filtros")
    if (L(leaderboard) === "true") {
      const genero = req.query.genero || undefined;
      const rows = await repo.getLeaderboard({
        temporadaID: temporadaID ? S(temporadaID) : undefined,
        tipoDePartido: tipoDePartido ? normalizeTipo(tipoDePartido) : undefined,
        deporte: deporte ? normalizeDeporte(deporte) : undefined,
        filtroId: undefined,
        genero,
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
      console.log('Filtro deporte:', dep);
      rows = rows.filter((r) => (dep == null ? r.deporte == null : L(r.deporte) === dep));
    }
    //if (filtroId != null) rows = rows.filter((r) => S(r.filtroId) === S(filtroId));

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
  getMejorRankingUltimaTemporada,
};
