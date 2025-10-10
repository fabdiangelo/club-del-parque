import { TemporadaRepository } from "../infraestructure/adapters/TemporadaRepository.js";
import { CrearTemporada } from "../usecases/Temporada/CrearTemporada.js";
import { EliminarTemporada } from "../usecases/Temporada/EliminarTemporada.js";
import { GetTemporadaById } from "../usecases/Temporada/GetTemporadaById.js";


class TemporadaController {
    constructor() {
        this.crearTemporadaUseCase = new CrearTemporada(new TemporadaRepository());
        this.getTemporadaByIdUseCase = new GetTemporadaById(new TemporadaRepository());
        this.eliminarTemporadaUseCase = new EliminarTemporada(new TemporadaRepository());
    }


    async createTemporada(req, res) {
        const temporadaData = req.body;

        console.log("TEMPORADA DATA, ", temporadaData);
        try {
            const nuevaTemporada = await this.crearTemporadaUseCase.execute(temporadaData);
            res.status(201).json(nuevaTemporada);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getTemporadaById(req, res) {
        const { id } = req.params;
        try {
            const temporada = await this.getTemporadaByIdUseCase.execute(id);
            if (!temporada) {
                return res.status(404).json({ error: "Temporada no encontrada" });
            }
            res.status(200).json(temporada);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    
    async deleteTemporada(req, res) {
        const { id } = req.params;
        try {
            await this.eliminarTemporada.execute(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }


}
export default new TemporadaController();