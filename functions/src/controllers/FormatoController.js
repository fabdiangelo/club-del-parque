import Precarga from "../usecases/Campeonatos/Precarga.js";
import GetAllFormatos from "../usecases/Campeonatos/GetAllFormatos.js";
import SaveFormato from "../usecases/Campeonatos/SaveFormato.js";

class FormatoController {
  async precargarFormatos(req, res) {
    try {
      await Precarga.execute();
      return res.status(200).json({ message: 'Formatos precargados exitosamente' });
    } catch (err) {
      console.error('Error precargando formatos:', err);
      return res.status(500).json({ error: 'Error precargando formatos' });
    }
  }

  async getFormatos(req, res) {
    try {
      const formatos = await GetAllFormatos.execute();
      return res.status(200).json(formatos);
    } catch (err) {
      console.error('Error obteniendo formatos:', err);
      return res.status(500).json({ error: 'Error obteniendo formatos' });
    }
  }

  async saveFormato(req, res) {
    try {
      const payload = req.body || {};
      await SaveFormato.execute(payload);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error guardando formato:', err);
      return res.status(400).json({ error: err.message || String(err) });
    }
  }
}

export default new FormatoController();
