import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
db.settings?.({ ignoreUndefinedProperties: true });

class AuthService {
    /**
   * Verifica idToken, obtiene uid y busca en Firestore en orden:
   * administradores -> federados -> usuarios
   * Devuelve objeto con role y profile (datos del documento si existe)
   */
  async verifyIdTokenAndGetProfile(idToken) {
    // Verifica token (lanza si inválido/expirado)
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || null;

    const collectionsOrder = ["administradores", "federados", "usuarios"];

    for (const col of collectionsOrder) {
      const snap = await db.collection(col).doc(uid).get();
      if (snap.exists) {
        const data = snap.data();
        return {
          uid,
          email,
          role: col,          // "administradores" | "federados" | "usuarios"
          profile: data,
          provider: decoded.firebase?.sign_in_provider || null,
        };
      }
    }

    // Si no está en ninguna colección, devolver al menos los datos básicos
    // (podés decidir crear el doc en "usuarios" aquí o devolver role: 'unknown')
    const authUser = await admin.auth().getUser(uid).catch(() => null);
    return {
      uid,
      email,
      role: "unknown",
      profile: authUser ? {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || null,
      } : null,
      provider: decoded.firebase?.sign_in_provider || null,
    };
  }

  async loginWithGoogle(idToken) {
    try {
      // Verificar token emitido por Firebase (Google)
      const decoded = await admin.auth().verifyIdToken(idToken);

      // Buscar al usuario en alguna colección
      const uid = decoded.uid;

      let userDoc =
        (await db.collection("usuarios").doc(uid).get()) ||
        (await db.collection("federados").doc(uid).get()) ||
        (await db.collection("administradores").doc(uid).get());

      let role = "unknown";
      if (userDoc.exists) {
        role = userDoc.ref.parent.id; // "usuarios" | "federados" | "administradores"
      } else {
        // Si es primera vez que entra, lo guardamos en "federados"
        await db.collection("federados").doc(uid).set({
          email: decoded.email,
          nombre: decoded.name,
          foto: decoded.picture,
          creadoEn: new Date(),
        });
        role = "federados";
      }

      return { uid, email: decoded.email, role };
    } catch (err) {
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new AuthService();