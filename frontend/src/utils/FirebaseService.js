import { initializeApp, getApps } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDUm2HjqeRufuyFS9SbvDCXJhQycDUPnjI",
  authDomain: "club-del-parque-68530.firebaseapp.com",
  databaseURL: "https://club-del-parque-68530-default-rtdb.firebaseio.com",
  projectId: "club-del-parque-68530",
  storageBucket: "club-del-parque-68530.appspot.com",
  messagingSenderId: "1014072531120",
  appId: "1:1014072531120:web:0feab3ffb7b85876ef0375",
  measurementId: "G-Q8TJD5C0ZM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const dbRT = getDatabase(app);

// Conecta al emulador SOLO si estás en localhost
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  connectDatabaseEmulator(dbRT, "localhost", 9000);
}

export { dbRT, app };