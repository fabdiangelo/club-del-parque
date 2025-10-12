import DBConnection from "../DBConnection";

export class ReservaRepository {
    constructor() {
        this.db = new DBConnection();
    }


    // campos reserva: id, canchaId, fechaHora, duracion, esCampeonato, partidoId, jugadoresIDS, quienPaga, autor, estado
    async save(reserva) {
        const {canchaId, partidoId, jugadoresIDS, quienPaga, autor, fechaHora} = reserva;

        if (!canchaId || !partidoId || !jugadoresIDS || jugadoresIDS.length < 2 || !quienPaga || !autor || !fechaHora) {
            throw new Error("Faltan campos obligatorios para crear la reserva");
        }


        const estado = reserva.estado || 'pendiente';
        const aceptadoPor = [];

        const doc = await this.db.putItem("reservas", {...reserva, estado, aceptadoPor}, reserva.id);

        console.log("Se ha creado la reserva con id: " + doc.id);
        return doc.id;
    }

    async getById(reservaId) {
        return this.db.getItem("reservas", reservaId);
    }

    async getAll() {
        return this.db.getAllItems('reservas').then(docs => docs);
    }

    async confirmarReserva(reservaId) {
        const reserva = await this.getById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }

        await this.db.updateItem("reservas", {estado: 'confirmada'}, reservaId);
        return reservaId;
    }



}