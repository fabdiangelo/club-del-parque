import { ReporteRepository } from '../infraestructure/adapters/ReportRepository.js';

import {CrearReporte} from '../usecases/Reportes/CrearReporte.js'
import {ObtenerAllReportes} from '../usecases/Reportes/ObtenerAllReportes.js'
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
            const { motivo, descripcion, fecha, estado, mailUsuario, leido } = req.body;
            
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
                leido: leido || false 
            };
            
            const resultado = await this.crearReporteUseCase.execute(reporte);
            res.status(201).json(resultado);


            // obtener usuario por idUsuario
            //const usuario = await this.usuarioRepository.obtenerPorId(idUsuario);
            // temporalmente
            const asunto = `Nuevo reporte creado: ${resultado}`;
            const mensaje = `Motivo: ${motivo}
Descripción: ${descripcion}`;

            const telefono = process.env.TELEFONOTEMPORAL;
            const destinatario = process.env.MAILTEMPORAL;

            const mensajeWPP = `Nuevo reporte ha sido creado: ${resultado}

${mensaje}
            
Usuario: ${mailUsuario}`;

            this.enviarWPPReporte(mensajeWPP, telefono);

            this.enviarMailReporte(destinatario, asunto, mensaje);

            

        } catch (error) {
            console.error("Error al crear reporte:", error);
            res.status(500).json({ error: "Error al crear reporte" });
        }
    }

    async obtenerReportes(req, res) {
        try {
            const reportes = await this.obtenerAllReportes.execute();
            res.status(200).json(reportes);
        } catch (error) {
            console.error("Error al obtener reportes:", error);
            res.status(500).json({ error: "Error al obtener reportes" });
        }
    }
}

export default new ReporteController();