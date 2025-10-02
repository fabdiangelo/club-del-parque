// FirebaseServices.js
import admin from "firebase-admin";

const projectId =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "demo-project";

const storageBucket =
  process.env.GCLOUD_STORAGE_BUCKET ||
  `${projectId}.appspot.com`;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
    storageBucket
  });
}

// Quick logs to confirm emulator wiring at boot
console.log("[admin] projectId =", projectId);
console.log("[admin] storageBucket =", storageBucket);
console.log("[admin] STORAGE_EMULATOR_HOST =", process.env.STORAGE_EMULATOR_HOST || "(not set)");

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

db.settings?.({ ignoreUndefinedProperties: true });

export default { auth, db, storage, FieldValue, Timestamp };

