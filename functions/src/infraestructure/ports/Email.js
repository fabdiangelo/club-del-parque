
import sgMail from "@sendgrid/mail";

export default class Email {
    constructor() {
        sgMail.setApiKey(process.env.EMAILAPIKEY);
    }
    
    enviarEmail = async(destinatario, asunto, mensaje) => {
        if (!destinatario || !asunto || !mensaje) {
            throw new Error("Todos los campos son obligatorios");
        }

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