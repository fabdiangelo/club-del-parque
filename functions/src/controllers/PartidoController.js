import { PartidoRepository } from '../infraestructure/adapters/PartidoRepository.js';
import { CrearPartido } from '../usecases/Partidos/CrearPartido.js'
import { EditarPartido } from '../usecases/Partidos/EditarPartido.js';
import {GetPartidoPorId} from '../usecases/Partidos/GetPartidoPorId.js';
import { GetPartidosByJugador } from '../usecases/Partidos/GetPartidosByJugador.js';
import { GetPartidosPorTemporada } from '../usecases/Partidos/GetPartidosPorTemporada.js';

class PartidoController {
    constructor() {
        this.crearPartido = new CrearPartido(new PartidoRepository());
        this.editarPartido = new EditarPartido(new PartidoRepository());
        this.getPartidoById = new GetPartidoPorId(new PartidoRepository());
        this.getPartidosPorTemporada = new GetPartidosPorTemporada(new PartidoRepository());
        this.getPartidosPorJugador = new GetPartidosByJugador(new PartidoRepository());
    }

    async crearPartido(req, res) {
        const partidoData = req.body;


        const {tipoPartido, temporadaID, canchaID, etapa, jugadores, equipoLocal, equipoVisitante} = req.body;

        if(!tipoPartido || !temporadaID || !canchaID || !etapa || !jugadores || !equipoLocal || !equipoVisitante) {
            return res.status(400).json({ error: "Faltan campos obligatorios, recuerde que se deben colocar los siguientes campos: tipoPartido, temporadaID, canchaID, etapaID, jugadores, equipoLocal, equipoVisitante" });
        }

        partidoData.fecha = partidoData.fecha || new Date().toISOString();
        partidoData = {...partidoData, estado: partidoData.estado || 'pendiente'};
        partidoData = {...partidoData, timestamp: Date.now()};
        partidoData = {...partidoData, resultado: partidoData.resultado || null};

        if(partidoData.tipoPartido === 'dobles' && partidoData.jugadores.length !== 4) {
            return res.status(400).json({ error: "Para partidos de dobles se requieren exactamente 4 jugadores." });
        }

        if(partidoData.tipoPartido === 'singles' && partidoData.jugadores.length !== 2) {
            return res.status(400).json({ error: "Para partidos de singles se requieren exactamente 2 jugadores." });
        }

        try {
            const nuevoPartido = await this.crearPartido(partidoData);
            res.status(201).json(nuevoPartido);
        } catch (error) {
            console.error("Error al crear partido:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getPartidoById(req, res) {
        const { id } = req.params;
        try {
            const partido = await this.getPartidoPorId(id);
            if (!partido) {
                return res.status(404).json({ error: "Partido no encontrado" });
            }
            res.json(partido);
        } catch (error) {
            console.error("Error al obtener partido:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async editarPartido(req, res) {
        const { id } = req.params;
        const partidoData = req.body;
        try {
            const partido = await this.editarPartido(id, partidoData);
            if (!partido) {
                return res.status(404).json({ error: "Partido no encontrado" });
            }
            res.json(partido);
        } catch (error) {
            console.error("Error al editar partido:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getPartidosByTemporada(req, res) {
        const { temporadaID } = req.params;
        try {
            const partidos = await this.getPartidosPorTemporada(temporadaID);
            res.json(partidos);
        } catch (error) {
            console.error("Error al obtener partidos por temporada:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getPartidosByJugador(req, res) {
        const { jugadorID } = req.params;
        try {
            const partidos = await this.getPartidosPorJugador(jugadorID);
            res.json(partidos);
        } catch (error) {
            console.error("Error al obtener partidos por jugador:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}

export default new PartidoController();