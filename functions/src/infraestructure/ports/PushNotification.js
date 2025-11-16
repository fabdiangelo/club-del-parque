import admin from 'firebase-admin';


export const enviarNotificacion = async(TokensToNotify, title, body, link) => {
  console.log("enviarNotificacion called");

  for (const token of TokensToNotify) {
    const message = {
      token: token,
      data: {
        title: title,
        body: body,
        url: link,
        icon: '/icon192.png',
        
      }
    };
    try {
      const response = await admin.messaging().send(message);
      console.log("Notificación enviada:", response);
    } catch (error) {
      console.error("Error enviando notificación:", error);
    }
  }
}
