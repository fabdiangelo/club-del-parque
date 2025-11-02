import admin from "firebase-admin";

// ⚙️ CONFIGURACIÓN BÁSICA
const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "demo-project";

const storageBucket =
  process.env.GCLOUD_STORAGE_BUCKET ||
  `${projectId}.appspot.com`;

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.firebaseio.com`;

// 🧩 Inicialización de firebase-admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // 🔹 agrega esto
    projectId,
    storageBucket,
    databaseURL,
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export const rtdb = admin.database();
export const messaging = admin.messaging();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

db.settings?.({ ignoreUndefinedProperties: true });

export default { auth, db, storage, rtdb, messaging, FieldValue, Timestamp };
