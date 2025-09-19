import DBConnection from "../infraestructure/DBConnection";

class AuthService {
  constructor(){
    this.db = new DBConnection();
  }
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
      const snap = await this.db.getItem(col, uid);
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
}

export default new AuthService();