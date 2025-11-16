import DBConnection from "../ports/DBConnection.js";
import NotiConnection from "../ports/NotiConnection.js";
import { PartidoRepository } from "./PartidoRepository.js";

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

        try {
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

                for (const admin of allAdmins) {
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

            const noti = new NotiConnection();
            const partido = reserva.partidoId ? await this.db.getItem("partidos", reserva.partidoId) : null;

            let equipoContrario = [];
            try {
                if (partido && Array.isArray(partido.equipoLocal) && partido.equipoLocal.includes(autor)) {
                    equipoContrario = Array.isArray(partido.equipoVisitante) ? partido.equipoVisitante : [];
                } else if (partido && Array.isArray(partido.equipoLocal)) {
                    equipoContrario = Array.isArray(partido.equipoLocal) ? partido.equipoLocal : [];
                }
            } catch (e) {
                equipoContrario = [];
            }

            for (const j of equipoContrario) {
                await noti.pushNotificationTo(j, {
                    tipo: "actualizacion_partido",
                    resumen: "El equipo contrario ha aceptado un horario para jugar el partido",
                    href: `/partido/${reserva.partidoId || ''}`
                }).catch(() => { });
            }






            return doc.id;
        } catch (error) {
            throw new Error(error.message);
        }

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


        const reserva = await this.getReservaById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }

        // Marcar la reserva como confirmada
        await this.db.updateItem("reservas", reservaId, { estado: 'confirmada' });

        // Intentar programar el partido asociado (fechaProgramada, estado, cancha)
        try {
            if (reserva.partidoId) {
                const partido = await this.db.getItem('partidos', reserva.partidoId).catch(() => null);
                if (partido) {
                    const updatedPartido = {
                        ...partido,
                        fechaProgramada: reserva.fechaHora || partido.fechaProgramada,
                        estado: 'programado',
                        canchaID: reserva.canchaId || partido.canchaID || partido.canchaId || null,
                    };
                    // Use PartidoRepository.update so etapa structures are propagated
                    try {
                        const pr = new PartidoRepository();
                        await pr.update(reserva.partidoId, updatedPartido);
                    } catch (e) {
                        console.warn('No se pudo actualizar partido tras confirmar reserva:', e?.message || e);
                    }
                }
            }
        } catch (e) {
            console.warn('Error al intentar setear partido tras confirmar reserva:', e?.message || e);
        }

        const noti = new NotiConnection();
        for (const j of reserva.jugadoresIDS) {
            await noti.pushNotificationTo(j, {
                tipo: "reserva_confirmada",
                resumen: "Tu reserva ha sido confirmada",
                href: `/partido/${reserva.partidoId}`
            }).catch(() => { });
        }

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

    async getReservaById(id) {
        return this.db.getItem('reservas', id);
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

        const reserva = await this.getReservaById(reservaId);
        if (!reserva) {
            throw new Error("La reserva no existe");
        }
        await this.db.updateItem("reservas", { estado: 'cancelada' }, reservaId);
        return reservaId;
    }

}