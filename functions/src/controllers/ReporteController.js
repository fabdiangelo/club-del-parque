import { ReporteRepository } from "../infraestructure/adapters/ReportRepository.js";

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

import GetActualUser from "../usecases/Auth/GetActualUser.js";

import SolicitarFederacion from "../usecases/Reportes/SolicitarFederacion.js";
import MarcarReporteResuelto from "../usecases/Reportes/MarcarReporteResuelto.js";
import ObtenerReportesSinResolver from "../usecases/Reportes/ObtenerReportesSinResolver.js";
import ObtenerDatosUsuario from "../usecases/Usuarios/ObtenerDatosUsuario.js";
import { CrearReporte } from "../usecases/Reportes/CrearReporte.js";
import { ObtenerAllReportes } from "../usecases/Reportes/ObtenerAllReportes.js";
import { EnviarMail } from "../usecases/EnviarMail.js";
import { EmailRepository } from "../infraestructure/adapters/EmailRepository.js";
import { EnviarWPP } from "../usecases/EnviarWPP.js";
import { WhatsappRepository } from "../infraestructure/adapters/WhatsappRepository.js";

class ReporteController {
  constructor() {
    this.crearReporteUseCase = new CrearReporte(new ReporteRepository());
    this.obtenerAllReportes = new ObtenerAllReportes(new ReporteRepository());
    this.enviarMail = new EnviarMail(new EmailRepository());
    this.enviarWPP = new EnviarWPP(new WhatsappRepository());
  }

  async enviarMailReporte(destinatario, asunto, mensaje) {
    try {
      const resultado = await this.enviarMail.ejecutar(
        mensaje,
        destinatario,
        asunto
      );

      console.log("EMAIL ENVIADO CORRECTAMENTE", resultado);
      return resultado;
    } catch (error) {
      console.log("Ocurrió un error al enviar el email del reporte:", error);
      return null;
    }
  }

  async enviarWPPReporte(mensaje, telefono) {
    try {
      const resultado = await this.enviarWPP.ejecutar(mensaje, telefono);

      console.log("WPP ENVIADO CORRECTAMENTE", resultado);
      return resultado;
    } catch (error) {
      console.log("Ocurrió un error al enviar el WPP del reporte:", error);
      return null;
    }
  }

  async crearReporte(req, res) {
    try {
      const {
        motivo,
        descripcion,
        fecha,
        estado,
        mailUsuario,
        leido,
        tipo,
        partidoId: partidoIdBody,
        partidoID: partidoIDBody,
      } = req.body;

      if (!motivo || !descripcion) {
        return res
          .status(400)
          .json({ error: "Motivo y descripción son requeridos" });
      }

      // normalizamos nombre del campo
      const partidoId = partidoIdBody ?? partidoIDBody ?? null;

      // (opcional) validación leve si es disputa
      if (
        (tipo === "disputa_resultado" || motivo === "disputa_resultado") &&
        !partidoId
      ) {
        return res
          .status(400)
          .json({ error: "partidoId es requerido para disputas de resultado" });
      }

      const reporte = {
        motivo,
        descripcion,
        fecha: fecha || new Date().toISOString(),
        estado: estado || "pendiente",
        mailUsuario,
        leido: leido || false,
        tipo: tipo || "reporte_bug",
        partidoId, // 👈 persistimos referencia al partido si vino
      };

      const resultado = await this.crearReporteUseCase.execute(reporte);
      res.status(201).json(resultado);

      // Notificaciones opcionales (con partidoId si existe)
      const asunto = `Nuevo reporte creado: ${resultado}`;
      const mensaje =
        `Motivo: ${motivo}\n` +
        `Descripción: ${descripcion}` +
        (partidoId ? `\nPartido: ${partidoId}` : "");

      const telefono = process.env.TELEFONOTEMPORAL;
      const destinatario = process.env.MAILTEMPORAL;

      const mensajeWPP =
        `Nuevo reporte ha sido creado: ${resultado}\n` +
        `${mensaje}\n\nUsuario: ${mailUsuario || "—"}`;

      this.enviarWPPReporte(mensajeWPP, telefono);
      this.enviarMailReporte(destinatario, asunto, mensaje);
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
      const user = GetActualUser.execute(sessionCookie);
      if (user.rol !== "administrador") {
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

      const usuario = await ObtenerDatosUsuario.execute(userId);
      if (!usuario) {
        return res.status(401).json({ error: "No se encontrpo al usuario" });
      }

      if (usuario.estado == "federacion_pendiente") {
        return res
          .status(404)
          .json({ error: "El usuario ya tiene una federacion pendiente" });
      }

      const msg = await SolicitarFederacion.execute(usuario, justificante);

      const payload = {
        uid: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 2 * 60 * 60 * 1000,
        path: "/",
      });

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

  async obtenerCantReportesSinResolver(req, res) {
    try {
      const sessionCookie = req.cookies.session || "";
      if (!sessionCookie) {
        return res.status(401).json({ error: "No session cookie found" });
      }
      // Verificar la cookie
      const user = GetActualUser.execute(sessionCookie);
      if (user.rol !== "administrador") {
        return res.status(403).json({ error: "Acceso no autorizado" });
      }
      const reportesSinResolver = await ObtenerReportesSinResolver.execute();
      res.status(200).json(reportesSinResolver);
    } catch (error) {
      console.error("Error al obtener reportes sin resolver:", error);
      res.status(500).json({ error: "Error al obtener reportes sin resolver" });
    }
  }
}

export default new ReporteController();
