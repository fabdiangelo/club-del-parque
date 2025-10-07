import GetAllFormatosEtapas from "../usecases/Campeonatos/GetAllFormatosEtapas.js";
import SaveFormatoEtapa from "../usecases/Campeonatos/SaveFormatoEtapa.js";

class FormatoEtapaController {
  async getFormatosEtapas(req, res) {
    try {
      const list = await GetAllFormatosEtapas.execute();
      return res.status(200).json(list);
    } catch (err) {
      console.error('Error obteniendo formatos de etapa:', err);
      return res.status(500).json({ error: 'Error obteniendo formatos de etapa' });
    }
  }

  async saveFormatoEtapa(req, res) {
    try {
      const payload = req.body || {};
      // if put with :id param, ensure id is set
      if (req.params && req.params.id) payload.id = req.params.id;
      await SaveFormatoEtapa.execute(payload);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error guardando formato de etapa:', err);
      return res.status(400).json({ error: err.message || String(err) });
    }
  }
}

export default new FormatoEtapaController();
