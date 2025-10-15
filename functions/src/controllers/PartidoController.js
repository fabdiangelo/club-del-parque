import { PartidoRepository } from '../infraestructure/adapters/PartidoRepository.js';
import { CrearPartido } from '../usecases/Partidos/CrearPartido.js'
import { EditarPartido } from '../usecases/Partidos/EditarPartido.js';
import { EliminarPartido } from '../usecases/Partidos/EliminarPartido.js';
import { GetAllPArtidos } from '../usecases/Partidos/GetAllPartidos.js';
import {GetPartidoPorId} from '../usecases/Partidos/GetPartidoPorId.js';
import { GetPartidosByJugador } from '../usecases/Partidos/GetPartidosByJugador.js';
import { GetPartidosPorTemporada } from '../usecases/Partidos/GetPartidosPorTemporada.js';
import { SetGanadoresPartido } from '../usecases/Partidos/SetGanadoresPartido.js';


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
async setGanadores(req, res) {
    const { id } = req.params;
    const { ganadores = [], resultado = null } = req.body;

    if (!Array.isArray(ganadores)) {
      return res.status(400).json({ error: "ganadores debe ser un array" });
    }

    try {
      const partido = await this.setGanadoresUseCase.execute(id, ganadores, resultado);
      res.json(partido);
    } catch (error) {
      console.error("Error al setear ganadores:", error);
      res.status(500).json({ error: "Error interno del servidor", mensaje: error.message });
    }
  }
    async eliminarPartido(req, res) {
        const { id } = req.params;
        try {
            const result = await this.eliminarPartidoUseCase.execute(id);
            res.status(200).json({ message: `Partido ${result} eliminado.` });
        } catch (error) {
            console.error("Error al eliminar partido:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async crearPartido(req, res) {
        console.log("PartidoController - crearPartido llamado");
        let partidoData = req.body;


        const {tipoPartido, temporadaID, canchaID, etapa, jugadores, equipoLocal, equipoVisitante} = req.body;

        if(!tipoPartido || !temporadaID || !canchaID || !etapa || !jugadores || !equipoLocal || !equipoVisitante) {
            return res.status(400).json({ error: "Faltan campos obligatorios, recuerde que se deben colocar los siguientes campos: tipoPartido, temporadaID, canchaID, etapa, jugadores, equipoLocal, equipoVisitante" });
        }

        if(tipoPartido !== 'singles' && tipoPartido !== 'dobles') {
            return res.status(400).json({ error: "El tipo de partido debe ser 'singles' o 'dobles'." });
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
            const nuevoPartido = await this.crearPartidoUseCase.execute(partidoData);
            res.status(201).json(nuevoPartido);
        } catch (error) {
            console.error("Error al crear partido:", error);
            res.status(500).json({error: "Error interno del servidor", mensaje: error.message}); 
        }
    }

    async getPartidoById(req, res) {
        const { id } = req.params;
        console.log("Buscando partido con ID:", id);
        
        try {
            const partido = await this.getPartidoByIdUseCase.execute(id);
            console.log("Resultado de búsqueda:", partido);
            
            if (!partido) {
                console.log("Partido no encontrado en base de datos");
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
        
        console.log("ID recibido para editar:", id);
        console.log("Datos para editar:", partidoData);
        
        if (!id || id.trim() === '') {
            return res.status(400).json({ error: "ID del partido es requerido" });
        }
        
        try {
            const partido = await this.editarPartidoUseCase.execute(id, partidoData);
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
            const partidos = await this.getPartidosPorTemporadaUseCase.execute(temporadaID);
            res.json(partidos);
        } catch (error) {
            console.error("Error al obtener partidos por temporada:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getPartidosByJugador(req, res) {
        const { jugadorID } = req.params;
        try {
            const partidos = await this.getPartidosPorJugadorUseCase.execute(jugadorID);
            res.json(partidos);
        } catch (error) {
            console.error("Error al obtener partidos por jugador:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}

export default new PartidoController();