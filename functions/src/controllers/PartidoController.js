// src/controllers/PartidoController.js
import { PartidoRepository } from '../infraestructure/adapters/PartidoRepository.js';
import { CrearPartido } from '../usecases/Partidos/CrearPartido.js';
import { EditarPartido } from '../usecases/Partidos/EditarPartido.js';
import { EliminarPartido } from '../usecases/Partidos/EliminarPartido.js';
import { GetAllPArtidos } from '../usecases/Partidos/GetAllPartidos.js';
import { GetPartidoPorId } from '../usecases/Partidos/GetPartidoPorId.js';
import { GetPartidosByJugador } from '../usecases/Partidos/GetPartidosByJugador.js';
import { GetPartidosPorTemporada } from '../usecases/Partidos/GetPartidosPorTemporada.js';
import { SetGanadoresPartido } from '../usecases/Partidos/SetGanadoresPartido.js';
import { AgregarDisponibilidad } from '../usecases/Partidos/AgregarDisponibilidad.js';
import { AceptarPropuesta } from '../usecases/Reservas/AceptarPropuesta.js';

const normID = (v) => String(v ?? '').trim();
const uniq = (arr = []) => Array.from(new Set((arr || []).map(normID)));
const subset = (arr = [], sup = []) => (arr || []).every((x) => sup.includes(x));
const toIsoOr = (v, fallback = new Date().toISOString()) => {
  if (!v) return fallback;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
};

class PartidoController {
  constructor() {
    this.crearPartidoUseCase = new CrearPartido(new PartidoRepository());
    this.editarPartidoUseCase = new EditarPartido(new PartidoRepository());
    this.getPartidoByIdUseCase = new GetPartidoPorId(new PartidoRepository());
    this.getPartidosPorTemporadaUseCase = new GetPartidosPorTemporada(new PartidoRepository());
    this.getPartidosPorJugadorUseCase = new GetPartidosByJugador(new PartidoRepository());
    this.getAllPartidosUseCase = new GetAllPArtidos(new PartidoRepository());
    this.eliminarPartidoUseCase = new EliminarPartido(new PartidoRepository());
    this.setGanadoresUseCase = new SetGanadoresPartido(new PartidoRepository());
    this.agregarDisponibilidadUseCase = new AgregarDisponibilidad(new PartidoRepository());
    this.aceptarPropuestaUseCase = new AceptarPropuesta(new PartidoRepository());
  }

  async aceptarPropuesta(req, res) {
    const { propuestaId } = req.body;
    const { id } = req.params;

    if (!propuestaId) {
      return res.status(400).json({ error: 'El parámetro propuestaId es requerido.' });
    }

    console.log("PROPUESTA ID =:", propuestaId);
    console.log("PARTIDO ID =:", id);

    try {
      const result = await this.aceptarPropuestaUseCase.execute(id, propuestaId);
      res.json(result);
    } catch (error) {
      console.error("Error al aceptar propuesta:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllPartidos(req, res) {
    try {
      const partidos = await this.getAllPartidosUseCase.execute();
      res.json(partidos);
    } catch (error) {
      console.error("Error al obtener partidos:", error);
      res.status(500).json({ error: error });
    }
  }


  // GET /partidos
  async getAllPartidos(req, res) {
    try {
      const partidos = await this.getAllPartidosUseCase.execute();
      return res.json(partidos);
    } catch (error) {
      console.error('Error al obtener partidos:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: String(error?.message || '') });
    }
  }

  // POST /partidos/:id/ganadores
  async setGanadores(req, res) {
    const { id } = req.params;
    const {
      ganadores = [],
      resultado = null,
      puntosGanador,
      puntosPerdedor,
    } = req.body;

    if (!Array.isArray(ganadores)) {
      return res.status(400).json({ error: 'ganadores debe ser un array' });
    }

    const cleanGanadores = uniq(ganadores);

    // Importante: si no vienen en el body, dejar undefined para que aplique 3/1/0 (+WO según servicio)
    const hasPG = Object.prototype.hasOwnProperty.call(req.body, 'puntosGanador');
    const hasPP = Object.prototype.hasOwnProperty.call(req.body, 'puntosPerdedor');
    const optsPG = hasPG ? Number(puntosGanador) : undefined;
    const optsPP = hasPP ? Number(puntosPerdedor) : undefined;

    try {
      const partido = await this.setGanadoresUseCase.execute(
        id,
        cleanGanadores,
        resultado,
        optsPG,
        optsPP,
      );
      return res.json(partido);
    } catch (error) {
      const msg = String(error?.message || '');
      if (/jugador/i.test(msg) && /no existe/i.test(msg)) {
        return res.status(404).json({ error: 'Jugador inexistente', mensaje: msg });
      }
      console.error('Error al setear ganadores:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: msg });
    }
  }
  async agregarDisponibilidad(req, res) {
    try {
      const { id } = req.params;

      console.log("entrando aca, id:", id);
      const { disponibilidad = [], usuarioId = null } = req.body || {};
      const result = await this.agregarDisponibilidadUseCase.execute(id, disponibilidad, usuarioId);
      res.json({ ok: true, disponibilidades: result });
    } catch (error) {
      console.error("Error al agregar disponibilidad:", error);
      res.status(400).json({ error: error.message || "Error interno del servidor" });
    }
  }

  async crearPartido(req, res) {
    console.log("PartidoController - crearPartido llamado");
    let partidoData = req.body;

    try {
      const partido = await this.setGanadoresUseCase.execute(
        id,
        cleanGanadores,
        resultado,
        optsPG,
        optsPP,
      );
      return res.json(partido);
    } catch (error) {
      const msg = String(error?.message || '');
      if (/jugador/i.test(msg) && /no existe/i.test(msg)) {
        return res.status(404).json({ error: 'Jugador inexistente', mensaje: msg });
      }
      console.error('Error al setear ganadores:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: msg });
    }
  }

  // POST /partidos/:id/disponibilidades
  async agregarDisponibilidad(req, res) {
    try {
      const { id } = req.params;
      const { disponibilidad = [], usuarioId = null } = req.body || {};
      const result = await this.agregarDisponibilidadUseCase.execute(id, disponibilidad, usuarioId);
      return res.json({ ok: true, disponibilidades: result });
    } catch (error) {
      console.error('Error al agregar disponibilidad:', error);
      return res.status(400).json({ error: error.message || 'Error interno del servidor' });
    }
  }



  // DELETE /partidos/:id
  async eliminarPartido(req, res) {
    const { id } = req.params;
    try {
      const result = await this.eliminarPartidoUseCase.execute(id);
      return res.status(200).json({ message: `Partido ${result} eliminado.` });
    } catch (error) {
      console.error('Error al eliminar partido:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: String(error?.message || '') });
    }
  }

  async crearPartido(req, res) {
    console.log('PartidoController - crearPartido llamado');
    let partidoData = { ...req.body };

    const required = [
      'tipoPartido',
      'temporadaID',
      'canchaID',
      'etapa',
      'jugadores',
      'equipoLocal',
      'equipoVisitante',
    ];
    for (const k of required) {
      if (partidoData[k] == null || (Array.isArray(partidoData[k]) && partidoData[k].length === 0)) {
        return res.status(400).json({ error: `Falta el campo obligatorio: ${k}` });
      }
    }

    if (partidoData.tipoPartido !== 'singles' && partidoData.tipoPartido !== 'dobles') {
      return res.status(400).json({ error: "El tipo de partido debe ser 'singles' o 'dobles'." });
    }

    const jugadores = uniq(partidoData.jugadores);
    const equipoLocal = uniq(partidoData.equipoLocal);
    const equipoVisitante = uniq(partidoData.equipoVisitante);
    const ganadores = uniq(partidoData.ganadores || []);

    const reqPlayers = partidoData.tipoPartido === 'singles' ? 2 : 4;
    if (jugadores.length !== reqPlayers) {
      return res.status(400).json({ error: `Se requieren exactamente ${reqPlayers} jugadores para ${partidoData.tipoPartido}.` });
    }

    const maxTeam = partidoData.tipoPartido === 'singles' ? 1 : 2;
    if (equipoLocal.length !== maxTeam || equipoVisitante.length !== maxTeam) {
      return res.status(400).json({ error: `Deben ser ${maxTeam} por lado (equipoLocal/equipoVisitante).` });
    }

    if (!subset(equipoLocal, jugadores) || !subset(equipoVisitante, jugadores)) {
      return res.status(400).json({ error: "Los equipos deben ser subconjunto de 'jugadores'." });
    }

    if (ganadores.length) {
      if (!subset(ganadores, jugadores)) {
        return res.status(400).json({ error: 'Los ganadores deben ser jugadores del partido.' });
      }
      if (partidoData.tipoPartido === 'singles' && ganadores.length !== 1) {
        return res.status(400).json({ error: 'En singles debe haber 1 ganador.' });
      }
      if (partidoData.tipoPartido === 'dobles' && ganadores.length !== 2) {
        return res.status(400).json({ error: 'En dobles deben ser 2 ganadores del mismo equipo.' });
      }
    }

    partidoData = {
      ...partidoData,
      jugadores,
      equipoLocal,
      equipoVisitante,
      ganadores,
      estado: partidoData.estado || 'programado', // programado | en_juego | finalizado
      timestamp: toIsoOr(partidoData.timestamp),
      resultado: partidoData.resultado ?? null,
      // deporte es opcional; si viene pasa directo (lo tomará RankingsFromPartido)
    };

    // Importante: no forzar 0 → si no vienen, quedan undefined para usar 3/1/0
    const hasPG = Object.prototype.hasOwnProperty.call(req.body, 'puntosGanador');
    const hasPP = Object.prototype.hasOwnProperty.call(req.body, 'puntosPerdedor');
    const puntosGanador = hasPG ? Number(req.body.puntosGanador) : undefined;
    const puntosPerdedor = hasPP ? Number(req.body.puntosPerdedor) : undefined;

    try {
      const nuevoPartido = await this.crearPartidoUseCase.execute(partidoData, { puntosGanador, puntosPerdedor });
      return res.status(201).json(nuevoPartido);
    } catch (error) {
      const msg = String(error?.message || '');
      if (/jugador/i.test(msg) && /no existe/i.test(msg)) {
        return res.status(404).json({ error: 'Jugador inexistente', mensaje: msg });
      }
      console.error('Error al crear partido:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: msg });
    }
  }

  async getPartidoById(req, res) {
    const { id } = req.params;
    console.log('Buscando partido con ID:', id);
    try {
      const partido = await this.getPartidoByIdUseCase.execute(id);
      console.log('Resultado de búsqueda:', partido);

      if (!partido) {
        console.log('Partido no encontrado en base de datos');
        return res.status(404).json({ error: 'Partido no encontrado' });
      }
      return res.json(partido);
    } catch (error) {
      console.error('Error al obtener partido:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: String(error?.message || '') });
    }
  }

  async editarPartido(req, res) {
    const { id } = req.params;
    let partidoData = { ...req.body };

    console.log('ID recibido para editar:', id);
    console.log('Datos para editar:', partidoData);

    if (!id || id.trim() === '') {
      return res.status(400).json({ error: 'ID del partido es requerido' });
    }

    if (Array.isArray(partidoData.jugadores)) partidoData.jugadores = uniq(partidoData.jugadores);
    if (Array.isArray(partidoData.equipoLocal)) partidoData.equipoLocal = uniq(partidoData.equipoLocal);
    if (Array.isArray(partidoData.equipoVisitante)) partidoData.equipoVisitante = uniq(partidoData.equipoVisitante);
    if (Array.isArray(partidoData.ganadores)) partidoData.ganadores = uniq(partidoData.ganadores);

    if (partidoData.timestamp) {
      partidoData.timestamp = toIsoOr(partidoData.timestamp);
    }

    // Importante: no forzar 0 → undefined dispara 3/1/0
    const hasPG = Object.prototype.hasOwnProperty.call(req.body, 'puntosGanador');
    const hasPP = Object.prototype.hasOwnProperty.call(req.body, 'puntosPerdedor');
    const puntosGanador = hasPG ? Number(req.body.puntosGanador) : undefined;
    const puntosPerdedor = hasPP ? Number(req.body.puntosPerdedor) : undefined;

    try {
      const partido = await this.editarPartidoUseCase.execute(id, partidoData, { puntosGanador, puntosPerdedor });
      if (!partido) {
        return res.status(404).json({ error: 'Partido no encontrado' });
      }
      return res.json(partido);
    } catch (error) {
      const msg = String(error?.message || '');
      if (/jugador/i.test(msg) && /no existe/i.test(msg)) {
        return res.status(404).json({ error: 'Jugador inexistente', mensaje: msg });
      }
      console.error('Error al editar partido:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: msg });
    }
  }

  async getPartidosByTemporada(req, res) {
    const { temporadaID } = req.params;
    try {
      const partidos = await this.getPartidosPorTemporadaUseCase.execute(temporadaID);
      return res.json(partidos);
    } catch (error) {
      console.error('Error al obtener partidos por temporada:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: String(error?.message || '') });
    }
  }

  async getPartidosByJugador(req, res) {
    const { jugadorID } = req.params;
    try {
      const partidos = await this.getPartidosPorJugadorUseCase.execute(jugadorID);
      return res.json(partidos);
    } catch (error) {
      console.error('Error al obtener partidos por jugador:', error);
      return res.status(500).json({ error: 'Error interno del servidor', mensaje: String(error?.message || '') });
    }
  }
}

export default new PartidoController();
