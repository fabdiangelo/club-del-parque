
import sgMail from "@sendgrid/mail";

export default class Email {
    constructor() {
    }
    
    enviarEmail = async(destinatario, asunto, mensaje) => {
        if (!destinatario || !asunto || !mensaje) {
            throw new Error("Todos los campos son obligatorios");
        }

        const apiKey = process.env.EMAILAPIKEY;
        if (!apiKey || !apiKey.startsWith("SG.")) {
            throw new Error("SendGrid API key not configured or invalid");
        }

        // Set API key right before sending
        sgMail.setApiKey(apiKey);

        const msg = {
            to: destinatario,
            from: "alan.franquez@estudiantes.utec.edu.uy",
            subject: asunto,
            text: mensaje,
        };
        

        try {
            const response = await sgMail.send(msg);
            console.log("Email enviado correctamente " + response[0].statusCode);
        } catch(error) {
            throw new Error("Error al enviar el email: " + error.message);
        }
    }
}