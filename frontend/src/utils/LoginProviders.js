import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDUm2HjqeRufuyFS9SbvDCXJhQycDUPnjI",
  authDomain: "club-del-parque-68530.firebaseapp.com",
  databaseURL: "https://club-del-parque-68530-default-rtdb.firebaseio.com",
  projectId: "club-del-parque-68530",
  storageBucket: "club-del-parque-68530.firebasestorage.app",
  messagingSenderId: "1014072531120",
  appId: "1:1014072531120:web:0feab3ffb7b85876ef0375",
  measurementId: "G-Q8TJD5C0ZM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/club-del-parque-68530/us-central1/api"

export const loginAndSendToBackend = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  const idToken = await user.getIdToken(); // token que ENVÍAS al backend

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }
  return res.json();
}

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    
    // Mandar el idToken a tu backend
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // credentials: "include",
      body: JSON.stringify({ idToken })
    });

    return await response.json();
  } catch (error) {
    console.error("Error en signInWithGoogle:", error);
    throw error;
  }
};