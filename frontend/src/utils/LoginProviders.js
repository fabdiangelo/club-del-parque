import { app } from "../utils/FirebaseService.js";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
} from "firebase/auth";

export const auth = getAuth(app);

// Connect to Auth emulator only when explicitly enabled via env var.
// Set VITE_USE_AUTH_EMULATOR=true and VITE_AUTH_EMULATOR_URL=http://localhost:9099 in frontend/.env
const useAuthEmu = import.meta.env.VITE_USE_AUTH_EMULATOR === 'true';
const authEmuUrl = import.meta.env.VITE_AUTH_EMULATOR_URL || 'http://localhost:9099';
if (useAuthEmu) {
  try {
    connectAuthEmulator(auth, authEmuUrl);
    console.log('Connected to Auth emulator at', authEmuUrl);
  } catch (e) {
    console.warn('Failed to connect to Auth emulator', e);
  }
}

export const loginAndSendToBackend = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  const idToken = await user.getIdToken();

  const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Login failed");
  }
  return await response.json();
}

export const googleProvider = new GoogleAuthProvider();

/**
 * Intenta login con Google. Puede devolver:
 * - { ok: true, idToken } en caso de éxito completo
 * - { accountExists: true, email, pendingCred } si existe cuenta con otro proveedor
 * - lanza error en otro caso
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in result:", result);
    const idToken = await result.user.getIdToken();
    return { ok: true, idToken, user: result.user };
  } catch (error) {
    // Caso: email ya existe pero con otro proveedor (p.ej. password)
    if (error.code === "auth/account-exists-with-different-credential") {
      const email = error.customData?.email || null;
      const pendingCred = GoogleAuthProvider.credentialFromError(error);
      return { accountExists: true, email, pendingCred };
    }
    // Otros errores
    throw error;
  }
}

/**
 * Helper que vincula la credencial pendiente (Google) a la cuenta actual del usuario
 * - currentUser: usuario ya autenticado (con password)
 * - pendingCred: credential retornado por GoogleProvider.credentialFromError
 */
export async function linkGoogleToExistingAccount(currentUser, pendingCred) {
  // linkWithCredential hace que el proveedor se añada al usuario
  const linked = await linkWithCredential(currentUser, pendingCred);
  // linked.user ahora tiene el provider agregado
  return linked;
}