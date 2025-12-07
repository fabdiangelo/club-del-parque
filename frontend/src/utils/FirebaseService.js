import { initializeApp, getApps } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};



const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const dbRT = getDatabase(app);
const messaging = getMessaging(app);

// // Conecta al emulador SOLO si estás en localhost
// if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
//   connectDatabaseEmulator(dbRT, "localhost", 9000);
// }

export { dbRT, app, messaging };