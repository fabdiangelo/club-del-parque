import ContarFederadosPorRequisitos from "../usecases/Campeonatos/ContarFederadosPorRequisitos.js";
import GetActualUser from "../usecases/Auth/GetActualUser.js";
import InscribirFederado from "../usecases/FederadoCampeonato/InscribirFederado.js";
import ResponderInvitacion from "../usecases/FederadoCampeonato/ResponderInvitacion.js";

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

  async inscribirFederado(req, res) {
    try{
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      const uid = req.params.uid || '';
      const user = GetActualUser.execute(sessionCookie)
      if(user.rol !== "federado" || user.uid != uid){
        return res.status(403).json({ error: "Acceso no autorizado" });
      }

  const campeonatoId = req.params.id || '';
  const inviteeUid = req.body?.inviteeUid || null;
  const id = await InscribirFederado.execute(uid, campeonatoId, inviteeUid);
      return res.status(200).json({ id });
    } catch (err) {
      console.error('Error creando campeonato:', err);
      return res.status(400).json({ error: err.message || String(err) });
    }
  }

  async aceptarInvitacion(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) return res.status(401).json({ error: "No session cookie found" });
      const user = GetActualUser.execute(sessionCookie);
      if (user.rol !== 'federado') return res.status(403).json({ error: 'Acceso no autorizado' });
      const campeonatoId = req.params.id || '';
      const result = await ResponderInvitacion.execute(user.uid, campeonatoId, 'aceptar');
      return res.json(result);
    } catch (err) {
      console.error('aceptarInvitacion error', err);
      return res.status(400).json({ error: err.message || String(err) });
    }
  }

  async rechazarInvitacion(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) return res.status(401).json({ error: "No session cookie found" });
      const user = GetActualUser.execute(sessionCookie);
      if (user.rol !== 'federado') return res.status(403).json({ error: 'Acceso no autorizado' });
      const campeonatoId = req.params.id || '';
      const result = await ResponderInvitacion.execute(user.uid, campeonatoId, 'rechazar');
      return res.json(result);
    } catch (err) {
      console.error('rechazarInvitacion error', err);
      return res.status(400).json({ error: err.message || String(err) });
    }
  }
}

export default new CampeonatosFederadosController();
