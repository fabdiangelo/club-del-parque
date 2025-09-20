import admin from "firebase-admin";

let app;
if (!admin.apps.length) {
  app = admin.initializeApp();
} else {
  app = admin.app();
}

const auth = admin.auth();
const db = admin.firestore();

db.settings?.({ ignoreUndefinedProperties: true });

export { auth, db };
