export default class WPP {
    constructor() {
        this.instanceKey = process.env.INSTANCEKEYWHATSAPP;
        this.apiKey = process.env.APIKEYWHATSAPP;
        }


    enviarWPP = async(mensaje, telefono) => {

        if (!telefono || !mensaje) {
            throw new Error("El número de teléfono y el mensaje son obligatorios");
        } 

        const response = await fetch(
    `https://7105.api.greenapi.com/${this.instanceKey}/sendMessage/${this.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: `${telefono}@c.us`,
        message: mensaje,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.json();
}
}