import ContarFederadosPorRequisitos from "../usecases/Campeonatos/ContarFederadosPorRequisitos.js";

class CampeonatosFederadosController {
  async contar(req, res) {
    try {
      const q = req.query || {};
      const payload = {
        genero: q.genero || 'ambos',
        edadDesde: typeof q.edadDesde !== 'undefined' && q.edadDesde !== '' ? Number(q.edadDesde) : undefined,
        edadHasta: typeof q.edadHasta !== 'undefined' && q.edadHasta !== '' ? Number(q.edadHasta) : undefined,
      };
      const cant = await ContarFederadosPorRequisitos.execute(payload);
      return res.json({ cantidad: cant });
    } catch (err) {
      console.error('Error contando federados:', err);
      return res.status(500).json({ error: 'Error contando federados' });
    }
  }
}

export default new CampeonatosFederadosController();
