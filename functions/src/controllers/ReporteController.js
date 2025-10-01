import { ReporteRepository } from '../infraestructure/adapters/ReportRepository.js';

import GetActualUser from "../usecases/Auth/GetActualUser.js";

import SolicitarFederacion from "../usecases/Reportes/SolicitarFederacion.js";
import MarcarReporteResuelto from '../usecases/Reportes/MarcarReporteResuelto.js';
import { CrearReporte } from '../usecases/Reportes/CrearReporte.js'
import { ObtenerAllReportes } from '../usecases/Reportes/ObtenerAllReportes.js'
import { EnviarMail } from '../usecases/EnviarMail.js';
import { EmailRepository } from '../infraestructure/adapters/EmailRepository.js';
import { EnviarWPP } from '../usecases/EnviarWPP.js';
import { WhatsappRepository } from '../infraestructure/adapters/WhatsappRepository.js';

class ReporteController {
    constructor() {
        this.crearReporteUseCase = new CrearReporte(new ReporteRepository());
        this.obtenerAllReportes = new ObtenerAllReportes(new ReporteRepository());
        this.enviarMail = new EnviarMail(new EmailRepository());
        this.enviarWPP = new EnviarWPP(new WhatsappRepository());
    }

    async enviarMailReporte(destinatario, asunto, mensaje) {
        try {

            const resultado = await this.enviarMail.ejecutar(mensaje, destinatario, asunto);

            console.log("EMAIL ENVIADO CORRECTAMENTE" , resultado);
            return resultado;
        } catch (error) {
            console.log("Ocurrió un error al enviar el email del reporte:", error);
            return null;
        }

    }

    async enviarWPPReporte(mensaje, telefono) {
        try {

            const resultado = await this.enviarWPP.ejecutar(mensaje, telefono);

            console.log("WPP ENVIADO CORRECTAMENTE" , resultado);
            return resultado;
        } catch (error) {
            console.log("Ocurrió un error al enviar el WPP del reporte:", error);
            return null;
        }
    }

    async crearReporte(req, res) {
        try {
            const { motivo, descripcion, fecha, estado, mailUsuario, leido, tipo } = req.body;
            
            // Validaciones básicas
            if (!motivo || !descripcion) {
                return res.status(400).json({ error: "Motivo y descripción son requeridos" });
            }

            const reporte = { 
                motivo, 
                descripcion, 
                fecha: fecha || new Date().toISOString(), 
                estado: estado || 'pendiente', 
                mailUsuario, 
                leido: leido || false,
                tipo: tipo || 'reporte_bug' 
            };
            
            const resultado = await this.crearReporteUseCase.execute(reporte);
            res.status(201).json(resultado);


            // obtener usuario por idUsuario
            //const usuario = await this.usuarioRepository.obtenerPorId(idUsuario);
            // temporalmente
            const asunto = `Nuevo reporte creado: ${resultado}`;
            const mensaje = `Motivo: ${motivo}\nDescripción: ${descripcion}`;

            const telefono = process.env.TELEFONOTEMPORAL;
            const destinatario = process.env.MAILTEMPORAL;

            const mensajeWPP = `Nuevo reporte ha sido creado: ${resultado}\n${mensaje}\n\nUsuario: ${mailUsuario}`;

            // this.enviarWPPReporte(mensajeWPP, telefono);

            // this.enviarMailReporte(destinatario, asunto, mensaje);

            

        } catch (error) {
            console.error("Error al crear reporte:", error);
            res.status(500).json({ error: "Error al crear reporte" });
        }
    }

    async obtenerReportes(req, res) {
        try {
            const sessionCookie = req.cookies.session || "";
            if (!sessionCookie) {
                return res.status(401).json({ error: "No session cookie found" });
            }
            // Verificar la cookie
            const user = GetActualUser.execute(sessionCookie)
            if(user.rol !== "administrador"){
                return res.status(403).json({ error: "Acceso no autorizado" });
            }
            const reportes = await this.obtenerAllReportes.execute();
            res.status(200).json(reportes);
        } catch (error) {
            console.error("Error al obtener reportes:", error);
            res.status(500).json({ error: "Error al obtener reportes" });
        }
    }

    async solicitarFederarUsuario(req, res) {
        try {
            const sessionCookie = req.cookies.session || "";
            if (!sessionCookie) {
                return res.status(401).json({ error: "No session cookie found" });
            }
            const userId = req.params.id;
            if (!userId) {
                return res.status(401).json({ error: "No user id found" });
            }
            const { justificante } = req.body;
            if (!justificante) {
                return res.status(400).json({ error: "Faltan datos obligatorios" });
            }

            const msg = await SolicitarFederacion.execute(userId, justificante);
            return res.json(msg);
        } catch (error) {
            console.error("Error al enviar solicitud de federacion", error);
            return res.status(401).json({ error: "Invalid or expired session" });
        }
    }

    async marcarResuelto(req, res) {
        try {
            const sessionCookie = req.cookies.session || "";
            if (!sessionCookie) {
                return res.status(401).json({ error: "No session cookie found" });
            }
            const reporteId = req.params.id;
            if (!reporteId) {
                return res.status(401).json({ error: "No report id found" });
            }
            const resultado = await MarcarReporteResuelto.execute(reporteId);
            res.status(200).json(resultado);
        } catch (error) {
            console.error("Error al marcar reporte como resuelto:", error);
            res.status(500).json({ error: "Error al marcar reporte como resuelto" });
        }
    }
}

export default new ReporteController();