import { TemporadaRepo } from "../infraestructure/adapters/TemporadaRepo.js";
import CreateAndActivateTemporada from "../usecases/Temporada/CreateAndActivateTemporada.js";
import ListTemporadas from "../usecases/Temporada/ListTemporadas.js";
import GetActiveTemporada from "../usecases/Temporada/GetActiveTemporada.js";
import ActivateTemporada from "../usecases/Temporada/ActivateTemporada.js";
import SetTemporadaEstado from "../usecases/Temporada/SetTemporadaEstado.js";

const ok = (res, data) => res.json(data);
const bad = (res, e, code = 400) => {
  const msg = e?.message || String(e);
  console.error("[Temporadas]", msg);
  return res.status(code).json({ error: msg });
};

const createAndActivate = CreateAndActivateTemporada(TemporadaRepo);
const listTemporadas = ListTemporadas(TemporadaRepo);
const getActiva = GetActiveTemporada(TemporadaRepo);
const activateById = ActivateTemporada(TemporadaRepo);
const setEstadoById = SetTemporadaEstado(TemporadaRepo);

const TemporadaController = {
  async crear(req, res) {
    try {
      const { anio, inicio, fin, tipoPartidoID } = req.body || {};
      const out = await createAndActivate({ anio, inicio, fin, tipoPartidoID });
      return ok(res, out);
    } catch (e) { return bad(res, e); }
  },
  async listar(_req, res) {
    try { return ok(res, await listTemporadas()); }
    catch (e) { return bad(res, e); }
  },
  async activa(_req, res) {
    try { return ok(res, await getActiva()); }
    catch (e) { return bad(res, e); }
  },
  async activar(req, res) {
    try { return ok(res, await activateById(req.params.id)); }
    catch (e) { return bad(res, e); }
  },
  async setEstado(req, res) {
    try { return ok(res, await setEstadoById(req.params.id, req.body?.estado)); }
    catch (e) { return bad(res, e); }
  },
};

export default TemporadaController;
