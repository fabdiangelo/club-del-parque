import DBConnection from "../ports/DBConnection.js";

export class ReservaRepository {
    constructor() {
        this.db = new DBConnection();
    }


    async aceptarInivitacion(reservaID, jugadorID) {
        const reserva = await this.getById(reservaID);
        
        if (reserva.aceptadoPor.includes(jugadorID)) {
            throw new Error("El jugador ya ha aceptado la invitación");
        }

        reserva.aceptadoPor.push(jugadorID);
        await this.update(reserva, reservaID);
        return reserva;
    }

    // campos reserva: id, canchaId, fechaHora, duracion, esCampeonato, tipoPartido, partidoId, jugadoresIDS, quienPaga, autor, estado
    async save(reserva) {
        const {canchaId, partidoId, jugadoresIDS, quienPaga, autor, fechaHora, tipoPartido} = reserva;
        
        if (!canchaId || !jugadoresIDS || jugadoresIDS.length < 2 || !quienPaga || !autor || !fechaHora) {
            throw new Error("Faltan campos obligatorios para crear la reserva, los campos obligatorios son: canchaId, jugadoresIDS (mínimo 2), quienPaga, autor, fechaHora");
        }

        if (tipoPartido && !['singles', 'dobles'].includes(tipoPartido)) {
            throw new Error("El tipo de partido debe ser 'singles' o 'dobles'");
        }

        if (tipoPartido === 'singles' && jugadoresIDS.length !== 2) {
            throw new Error("Para partidos de singles se requieren exactamente 2 jugadores");
        }
        if (tipoPartido === 'dobles' && jugadoresIDS.length !== 4) {
            throw new Error("Para partidos de dobles se requieren exactamente 4 jugadores");
        }        const cancha = await this.db.getItem("canchas", canchaId);
        if (!cancha) {
            throw new Error("La cancha asociada no existe");
        }

        if (partidoId && partidoId.trim() !== '') {
            const partido = await this.db.getItem("partidos", partidoId);
            if (!partido) {
                throw new Error("El partido asociado no existe");
            }
        }

        let noJugador = false;

        for (const j of jugadoresIDS) {
            const jugadorExists = await this.db.getItem("usuarios", j);
            if (!jugadorExists) {

                noJugador = true;
            }

            const federado =  await this.db.getItem("federados", j);
            if (!federado && !noJugador) {
                throw new Error(`El jugador con ID ${j} no es un federado`);
            }
        }


        const quienPagaExists = await this.db.getItem("usuarios", quienPaga);
        if (!quienPagaExists) {
            
            const quienPagaExists2 = await this.db.getItem("federados", quienPaga);
            if(!quienPagaExists2){
                throw new Error("El usuario que paga no existe");
            }
        }

        const autorExists = await this.db.getItem("usuarios", autor);
        if (!autorExists) {
            throw new Error("El usuario autor no existe");
        }

        if(new Date(fechaHora) < new Date()) {
            throw new Error("La fecha y hora de la reserva no puede ser en el pasado");
        }

        const estado = reserva.estado || 'pendiente';
        const aceptadoPor = [];
        const timestamp = Date.now();

        let deshabilitar = false;

        const doc = await this.db.putItem("reservas", {...reserva, estado, aceptadoPor, timestamp, deshabilitar: false}, reserva.id);

        console.log("Se ha creado la reserva con id: " + doc.id);
        return doc.id;
    }

    async getById(reservaId) {
        return this.db.getItem("reservas", reservaId);
    }

    async deshabilitarReserva(reservaId) {
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }

        console.log("Deshabilitando reserva con ID:", reservaId);

        const reserva = await this.db.getItem("reservas", reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }

        console.log("Reserva encontrada:", reserva);

        await this.db.updateItem("reservas", {deshabilitar: true}, reservaId);
        return reservaId;
    }

    async update(reserva, reservaId) {
        const existingReserva = await this.getById(reservaId);
        if (!existingReserva) {
            throw new Error("La reserva no existe");
        }

        const { canchaId, partidoId, jugadoresIDS, quienPaga, autor, fechaHora, tipoPartido } = reserva;

        // Validar tipoPartido
        if (tipoPartido && !['singles', 'dobles'].includes(tipoPartido)) {
            throw new Error("El tipo de partido debe ser 'singles' o 'dobles'");
        }

        // Validar número de jugadores según tipo de partido
        if (tipoPartido === 'singles' && jugadoresIDS && jugadoresIDS.length !== 2) {
            throw new Error("Para partidos de singles se requieren exactamente 2 jugadores");
        }
        if (tipoPartido === 'dobles' && jugadoresIDS && jugadoresIDS.length !== 4) {
            throw new Error("Para partidos de dobles se requieren exactamente 4 jugadores");
        }

        if (canchaId) {
            const cancha = await this.db.getItem("canchas", canchaId);
            if (!cancha) {
                throw new Error("La cancha asociada no existe");
            }
        }

        if (partidoId) {
            const partido = await this.db.getItem("partidos", partidoId);
            if (!partido) {
                throw new Error("El partido asociado no existe");
            }
        }

        for (const j of jugadoresIDS) {
            const jugadorExists = await this.db.getItem("usuarios", j);
            if (!jugadorExists) {
                throw new Error(`El jugador con ID ${j} no existe`);
            }
        }

        const quienPagaExists = await this.db.getItem("usuarios", quienPaga);
        if (!quienPagaExists) {
            throw new Error("El usuario que paga no existe");
        }

        const autorExists = await this.db.getItem("usuarios", autor);
        if (!autorExists) {
            throw new Error("El usuario autor no existe");
        }

        if (new Date(fechaHora) < new Date()) {
            throw new Error("La fecha y hora de la reserva no puede ser en el pasado");
        }

        const doc = await this.db.updateItem("reservas", {...existingReserva, ...reserva}, reservaId);
        return doc.id;
    }

    async getAll() {
        return this.db.getAllItems('reservas').then(docs => docs);
    }

    async getReservasFuturo() {
        const allReservas = await this.db.getAllItems('reservas');
        const now = new Date();
        return allReservas.filter(reserva => new Date(reserva.fechaHora) > now && (reserva.estado !== 'cancelada' && reserva.estado !== 'rechazada' && reserva.estado !== 'confirmada'));
    }

    async confirmarReserva(reservaId, usuarioId) {
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }

        if (!usuarioId || usuarioId.trim() === '') {
            throw new Error("ID de usuario es requerido");
        }

        const usuario = await this.db.getItem("usuarios", usuarioId);
        if (!usuario || usuario.rol !== 'administrador') {
            throw new Error("Usuario no autorizado para confirmar la reserva");
        }

        const reserva = await this.getById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }

        await this.db.updateItem("reservas", {estado: 'confirmada'}, reservaId);
        return reservaId;
    }

    async rechazarReserva(reservaId, usuarioId) {
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }

        if (!usuarioId || usuarioId.trim() === '') {
            throw new Error("ID de usuario es requerido");
        }

        const usuario = await this.db.getItem("usuarios", usuarioId);
        if (!usuario || usuario.rol !== 'administrador') {
            throw new Error("Usuario no autorizado para rechazar la reserva");
        }

        const reserva = await this.getById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }
        await this.db.updateItem("reservas", {estado: 'rechazada'}, reservaId);
        return reservaId;
    }

    async cancelarReserva(reservaId, usuarioId) {
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }

        if (!usuarioId || usuarioId.trim() === '') {
            throw new Error("ID de usuario es requerido");
        }

        const usuario = await this.db.getItem("usuarios", usuarioId);
        if (!usuario || usuario.rol !== 'administrador') {
            throw new Error("Usuario no autorizado para cancelar la reserva");
        }

        const reserva = await this.getById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }
        await this.db.updateItem("reservas", {estado: 'cancelada'}, reservaId);
        return reservaId;
    }   

}