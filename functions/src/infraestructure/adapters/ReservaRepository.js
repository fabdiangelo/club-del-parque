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

    async save(reserva) {
        const { canchaId, partidoId, jugadoresIDS, quienPaga, autor, fechaHora, duracion, tipoPartido } = reserva;

        const allReservas = await this.db.getAllItems('reservas');

        // Convertir fechaHora y calcular el rango de tiempo ocupado por la nueva reserva
        const fechaHoraInicioNueva = new Date(fechaHora);
        const fechaHoraFinNueva = new Date(fechaHoraInicioNueva.getTime() + duracion * 60 * 1000); // Duración en minutos

        // Verificar conflictos de horario
        const conflictoHorario = allReservas.some(r => {
            if (r.canchaId !== canchaId || r.deshabilitar === true) return false;

            const fechaHoraInicioExistente = new Date(r.fechaHora);
            const fechaHoraFinExistente = new Date(fechaHoraInicioExistente.getTime() + r.duracion * 60 * 1000);

            // Verificar si los rangos de tiempo se solapan
            return (
                (fechaHoraInicioNueva < fechaHoraFinExistente && fechaHoraFinNueva > fechaHoraInicioExistente)
            );
        });

        if (conflictoHorario) {
            throw new Error("Ya existe una reserva para la misma cancha en el mismo rango de tiempo");
        }

        if (!canchaId || !jugadoresIDS || jugadoresIDS.length < 2 || !quienPaga || !autor || !fechaHora || !duracion) {
            throw new Error("Faltan campos obligatorios para crear la reserva, los campos obligatorios son: canchaId, jugadoresIDS (mínimo 2), quienPaga, autor, fechaHora, duracion");
        }

        if (tipoPartido && !['singles', 'dobles'].includes(tipoPartido)) {
            throw new Error("El tipo de partido debe ser 'singles' o 'dobles'");
        }

        if (tipoPartido === 'singles' && jugadoresIDS.length !== 2) {
            throw new Error("Para partidos de singles se requieren exactamente 2 jugadores");
        }
        if (tipoPartido === 'dobles' && jugadoresIDS.length !== 4) {
            throw new Error("Para partidos de dobles se requieren exactamente 4 jugadores");
        }

        const cancha = await this.db.getItem("canchas", canchaId);
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

            const federado = await this.db.getItem("federados", j);
            const admin = await this.db.getItem("administradores", j);

            if (!federado && !noJugador && !admin) {
                throw new Error(`El jugador con ID ${j} no es un federado`);
            }
        }

        const quienPagaExists = await this.db.getItem("usuarios", quienPaga);
        if (!quienPagaExists) {
            console.log("Usuario que paga no es usuario normal, verificando en federados o administradores");
            console.log("Usuario que paga ID:", quienPaga);

            const quienPagaExistsFederado = await this.db.getItem("federados", quienPaga);
            const quienPagaExistsAdmin = await this.db.getItem("administradores", quienPaga);

            const allAdmins = await this.db.getAllItems("administradores");

            for(const admin of allAdmins) {
                console.log("Verificando admin:", admin);
            }

            if (!quienPagaExistsFederado && !quienPagaExistsAdmin) {
                throw new Error("El usuario que paga no existe");
            }
        }

        const autorExists = await this.db.getItem("usuarios", autor);
        const autorFederado = await this.db.getItem("federados", autor);
        const adminExists = await this.db.getItem("administradores", autor);
        if (!autorExists && !autorFederado && !adminExists) {
            throw new Error("El usuario autor no existe");
        }

        if (new Date(fechaHora) < new Date()) {
            throw new Error("La fecha y hora de la reserva no puede ser en el pasado");
        }

        const estado = reserva.estado || 'pendiente';
        const aceptadoPor = [];
        const timestamp = Date.now();

        const doc = await this.db.putItem("reservas", { ...reserva, estado, aceptadoPor, timestamp, deshabilitar: false }, reserva.id);

        console.log("Se ha creado la reserva con id: " + doc.id);
        return doc.id;
    }

    async habilitarReserva(reservaId) {
        console.log("llegand hasta aca", reservaId);
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }


        const reserva = await this.db.getItem("reservas", reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }

        try {

            const reservaActualizada = {
                ...reserva,
                deshabilitar: false
            };

            const result = await this.db.putItem("reservas", reservaActualizada, reservaId);
            console.log("Actualización exitosa:", result);
            return reservaId;
        } catch (error) {
            console.error("Error en updateItem:", error);
            throw error;
        }
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

        const doc = await this.db.updateItem("reservas", { ...existingReserva, ...reserva }, reservaId);
        return doc.id;
    }

    async getReservaByPartidoId(partidoId) {
        const allReservas = await this.db.getAllItems('reservas');
        return allReservas.find(reserva => reserva.partidoId === partidoId && !reserva.deshabilitar);
    }

    async getAll() {
        return this.db.getAllItems('reservas').then(docs => docs);
    }

    async getReservasFuturo() {
        const allReservas = await this.db.getAllItems('reservas');
        const now = new Date();
        return allReservas.filter(reserva => new Date(reserva.fechaHora) > now && (reserva.estado !== 'cancelada' && reserva.estado !== 'rechazada' && reserva.estado !== 'confirmada' && reserva.deshabilitar !== true));
    }

    async confirmarReserva(reservaId) {
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }

        console.log("Llegando hasta aca");


        const reserva = await this.getById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }

        await this.db.updateItem("reservas", reservaId, { estado: 'confirmada' });
        return reservaId;
    }

    async rechazarReserva(reservaId) {
        if (!reservaId || reservaId.trim() === '') {
            throw new Error("ID de reserva es requerido");
        }




        const reserva = await this.getById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }
        await this.db.updateItem("reservas", reservaId, { estado: 'rechazada' });
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
        await this.db.updateItem("reservas", { estado: 'cancelada' }, reservaId);
        return reservaId;
    }

}