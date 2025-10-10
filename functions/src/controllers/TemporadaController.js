import { TemporadaRepository } from "../infraestructure/adapters/TemporadaRepository";
import { CrearTemporada } from "../usecases/Temporada/CrearTemporada";
import { EliminarTemporada } from "../usecases/Temporada/EliminarTemporada";
import { GetTemporadaById } from "../usecases/Temporada/GetTemporadaById";


class TemporadaController {
    constructor(crearTemporada, getTemporadaById, eliminarTemporada) {
        this.crearTemporada = new CrearTemporada(new TemporadaRepository());
        this.getTemporadaById = new GetTemporadaById(new TemporadaRepository());
        this.eliminarTemporada = new EliminarTemporada(new TemporadaRepository());
    }


    async createTemporada(req, res) {
        const temporadaData = req.body;
        try {
            const nuevaTemporada = await this.crearTemporada.execute(temporadaData);
            res.status(201).json(nuevaTemporada);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getTemporadaById(req, res) {
        const { id } = req.params;
        try {
            const temporada = await this.getTemporadaById.execute(id);
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