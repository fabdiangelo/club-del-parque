import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: process.env.GCLOUD_STORAGE_BUCKET,
  });
} else {
  admin.app();
}

const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

db.settings?.({ ignoreUndefinedProperties: true });

export { auth, db, storage, FieldValue, Timestamp };
export default { auth, db, storage, FieldValue, Timestamp };