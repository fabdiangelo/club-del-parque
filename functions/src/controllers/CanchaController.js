import { CanchaRepository } from "../infraestructure/adapters/CanchaRepository.js";
import { CrearCancha } from "../usecases/Canchas/CrearCancha.js";
import { EliminarCancha } from "../usecases/Canchas/EliminarCancha.js";
import { GetAllCanchas } from "../usecases/Canchas/GetAllCanchas.js";
import { GetCanchaById } from "../usecases/Canchas/GetCanchaById.js";


class CanchaController {
    constructor() {
        this.eliminarCanchaUseCase = new EliminarCancha(new CanchaRepository());
        this.getAllCanchas = new GetAllCanchas(new CanchaRepository());
        this.getCanchaById = new GetCanchaById(new CanchaRepository());
        this.crearCanchaUseCase = new CrearCancha(new CanchaRepository());
    }


    async getAll(req, res) {
        try {
            const canchas = await this.getAllCanchas.execute();
            res.status(200).json(canchas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async eliminarCancha(req, res) {

        const { id } = req.params;
        try {
            await this.eliminarCanchaUseCase.execute(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req, res) {
        const { id } = req.params;
        try {
            const cancha = await this.getCanchaById.execute(id);
            if (!cancha) {
                return res.status(404).json({ error: "Cancha no encontrada" });
            }
            res.status(200).json(cancha);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async crearCancha(req, res) {
        console.log("req.body completo:", req.body);
        console.log("req.headers:", req.headers);
        
        const { nombre } = req.body;
        console.log("nombre extraído:", nombre);
        
        const obj = {
            nombre
        }
        try {
            const nuevaCancha = await this.crearCanchaUseCase.execute(obj);
            res.status(201).json(nuevaCancha);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

}

export default new CanchaController();