// functions/src/usecases/Rankings/EnsureRankingForFederado.js
import { RankingRepository } from "../../infraestructure/adapters/RankingRepository.js";
import { RankingCategoriaRepository } from "../../infraestructure/adapters/RankingCategoriaRepository.js";

const repo = new RankingRepository();
const rkCatRepo = new RankingCategoriaRepository();

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
  if (dep == null || dep === "") return null;
  const d = L(dep);
  if (d === "tenis" || d === "pádel" || d === "padel") return d === "padel" ? "padel" : "tenis";
  if (d === "padel") return "padel";
  throw new Error('deporte inválido ("tenis"|"padel")');
};

const validateCategoriaScope = async ({ categoriaId, temporadaID, deporte, tipoDePartido, filtroId }) => {
  if (categoriaId == null) return null;
  const cat = await rkCatRepo.findById(String(categoriaId));
  if (!cat) throw new Error("categoriaId no existe");

  const sameScope =
    S(cat.temporadaID) === S(temporadaID) &&
    L(cat.deporte) === L(deporte) &&
    L(cat.tipoDePartido) === normalizeTipo(tipoDePartido) &&
    (cat.filtroId == null ? filtroId == null : S(cat.filtroId) === S(filtroId));

  if (!sameScope) throw new Error("categoriaId pertenece a otro scope");
  return cat;
};

const getDefaultPointsForCategoriaAssignment = async ({
  temporadaID,
  deporte,
  tipoDePartido,
  filtroId,
  categoriaIdActual,
}) => {
  const catActual = await rkCatRepo.findById(String(categoriaIdActual));
  if (!catActual) return 0;

  const catsScope = await rkCatRepo.getByScope({
    temporadaID: S(temporadaID),
    deporte: normalizeDeporte(deporte),
    tipoDePartido: normalizeTipo(tipoDePartido),
    filtroId: filtroId ?? null,
  });

  const inferior = catsScope.find((c) => Number(c.orden) === Number(catActual.orden) + 1);
  if (!inferior) return 0;

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

const buildDeterministicId = ({
  temporadaID,
  usuarioID,
  tipoDePartido,
  deporte,
  filtroId,
}) => [
  "rk",
  L(temporadaID),
  L(usuarioID),
  normalizeTipo(tipoDePartido),
  deporte ? L(deporte) : "nodep",
  filtroId != null ? `f-${String(filtroId)}` : "nof",
].join("|");

export default {
  async execute({
    federadoId,
    temporadaID,
    deporte,
    tipoDePartido,
    filtroId = null,
    categoriaId,
    puntos,                 // <- NEW: absolute overwrite if provided
  }) {
    if (!S(federadoId) || !S(temporadaID) || !S(tipoDePartido)) {
      throw new Error("Faltan campos obligatorios: federadoId, temporadaID, tipoDePartido");
    }

    const tipo = normalizeTipo(tipoDePartido);
    const dep = normalizeDeporte(deporte);

    await validateCategoriaScope({
      categoriaId,
      temporadaID,
      deporte: dep,
      tipoDePartido: tipo,
      filtroId,
    });

    const existing = await repo.getByUsuarioTemporadaTipo(
      S(federadoId),
      S(temporadaID),
      tipo,
      dep || undefined,
      filtroId != null ? String(filtroId) : undefined
    );

    const now = new Date().toISOString();

    if (existing) {
      const patch = {
        categoriaId: categoriaId ?? null,
        updatedAt: now,
      };
      if (puntos !== undefined) {
        patch.puntos = N(puntos, 0);        // <- overwrite points
        // (Opcional) reset counters si querés realmente “desde cero”:
        // patch.partidosGanados = 0;
        // patch.partidosPerdidos = 0;
        // patch.partidosAbandonados = 0;
      }
      await repo.update(existing.id, patch);
      return repo.findById(existing.id);
    }

    // Crear con puntos explícitos si vienen; si no, usar tu default lógico
    const initialPoints =
      puntos !== undefined
        ? N(puntos, 0)
        : (categoriaId != null
            ? await getDefaultPointsForCategoriaAssignment({
                temporadaID,
                deporte: dep,
                tipoDePartido: tipo,
                filtroId,
                categoriaIdActual: categoriaId,
              })
            : 0);

    const id = buildDeterministicId({
      temporadaID,
      usuarioID: federadoId,
      tipoDePartido: tipo,
      deporte: dep,
      filtroId,
    });

    const doc = {
      id,
      temporadaID: S(temporadaID),
      usuarioID: S(federadoId),
      tipoDePartido: tipo,
      deporte: dep,
      puntos: initialPoints,
      categoriaId: categoriaId ?? null,
      filtroId: filtroId ?? null,
      filtrosSnapshot: null,
      partidosGanados: 0,
      partidosPerdidos: 0,
      partidosAbandonados: 0,
      createdAt: now,
      updatedAt: now,
    };

    await repo.save(doc);
    return doc;
  },
};
