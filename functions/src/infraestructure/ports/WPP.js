export default class WPP {
    constructor(mensaje, telefono) {
        this.mensaje = mensaje;
        this.telefono = telefono;
    }


    enviarWPP = async(mensaje, telefono) => {

        if (!this.telefono || !this.mensaje) {
            throw new Error("El número de teléfono y el mensaje son obligatorios");
        } 

        const response = await fetch(
    ``,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: `${this.telefono}@c.us`,
        message: this.mensaje,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return await response.json();
}
}