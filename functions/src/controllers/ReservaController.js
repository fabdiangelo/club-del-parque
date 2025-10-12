import {GetAllReservas} from '../usecases/Reservas/GetAllReservas.js';
import { ReservaRepository } from '../infraestructure/adapters/ReservaRepository.js';
import  {CrearReserva} from '../usecases/Reservas/CrearReserva.js';
import {CancelarReserva} from '../usecases/Reservas/CancelarReserva.js';
import {RechazarReserva} from '../usecases/Reservas/RechazarReserva.js';
import {GetReservaById} from '../usecases/Reservas/GetReservaById.js';
import {GetReservasFuturo} from '../usecases/Reservas/GetReservasFuturo.js';
import { EditarReserva } from '../usecases/Reservas/EditarReserva.js';



class ReservaController {
    constructor() {
        this.getAllReservasUseCase = new GetAllReservas(new ReservaRepository());
        this.getReservaByIdUseCase = new GetReservaById(new ReservaRepository());
        this.getReservasFuturoUseCase = new GetReservasFuturo(new ReservaRepository());
        this.rechazarReservaUseCase = new RechazarReserva(new ReservaRepository());
        this.cancelarReservaUseCase = new CancelarReserva(new ReservaRepository());
        this.crearReservaUseCase = new CrearReserva(new ReservaRepository());
        this.editarReservaUseCase = new EditarReserva(new ReservaRepository());
    }

    async editarReserva(req, res) {
        const { id } = req.params;
        const reservaData = req.body;
        try {
            const updatedReserva = await this.editarReservaUseCase.execute(id, reservaData);
            res.status(200).json(updatedReserva);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }   
    }


    async getAll(req, res) {
        try {


            const reservas = await this.getAllReservasUseCase.execute();
            res.status(200).json(reservas);
        } catch(error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getReservaById(req, res) {
        const { id } = req.params;
        try {
            const reserva = await this.getReservaByIdUseCase.execute(id);
            res.status(200).json(reserva);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async crearReserva(req, res) {
        console.log("ReservaController - crearReserva llamado");
        let reservaData = req.body;
        try {
            const nuevaReserva = await this.crearReservaUseCase.execute(reservaData);
            res.status(201).json(nuevaReserva);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async cancelarReserva(req, res) {
        const { id } = req.params;
        try {
            const result = await this.cancelarReservaUseCase.execute(id);
            res.status(200).json({ message: `Reserva ${result} cancelada.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async rechazarReserva(req, res) {
        const { id } = req.params;
        try {
            const result = await this.rechazarReservaUseCase.execute(id);
            res.status(200).json({ message: `Reserva ${result} rechazada.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async confirmarReserva(req, res) {
        const { id } = req.params;
        try {
            const result = await this.confirmarReservaUseCase.execute(id);
            res.status(200).json({ message: `Reserva ${result} confirmada.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

}

export default new ReservaController();