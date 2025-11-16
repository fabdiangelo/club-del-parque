importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDUm2HjqeRufuyFS9SbvDCXJhQycDUPnjI",
  authDomain: "club-del-parque-68530.firebaseapp.com",
  projectId: "club-del-parque-68530",
  messagingSenderId: "1014072531120",
  appId: "1:1014072531120:web:0feab3ffb7b85876ef0375",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📬 Recibido en background:", payload);

  // Intenta tomar desde `data` (ya que quitamos `notification` del backend)
  const title = payload.data?.title || "Notificación";
  const body = payload.data?.body || "Tienes una nueva notificación.";
  const url = payload.data?.url || "/";
  const icon = "/icon192.png";

  self.registration.showNotification(title, {
    body,
    data: { url },
    icon,
  });
});

// 🔗 Maneja el clic en la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
