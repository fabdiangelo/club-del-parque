import { initializeApp, getApps } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import {getMessaging} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB4NP1YYRd_Ubt8UIhCRkHEnlbmk5kVouI",
  authDomain: "club-del-parque-8ec2a.firebaseapp.com",
  databaseURL: "https://club-del-parque-8ec2a-default-rtdb.firebaseio.com",
  projectId: "club-del-parque-8ec2a",
  storageBucket: "club-del-parque-8ec2a.firebasestorage.app",
  messagingSenderId: "92425973252",
  appId: "1:92425973252:web:b2c14417addd27874f8f51",
  measurementId: "G-J59F487H2N"
};



const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const dbRT = getDatabase(app);
const messaging = getMessaging(app);

// // Conecta al emulador SOLO si estás en localhost
// if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
//   connectDatabaseEmulator(dbRT, "localhost", 9000);
// }

export { dbRT, app, messaging };