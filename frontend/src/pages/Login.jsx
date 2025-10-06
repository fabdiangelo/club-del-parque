import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthProvider";

import Navbar from "../components/Navbar.jsx";

import { 
  loginAndSendToBackend, 
  signInWithGoogle,
  linkGoogleToExistingAccount, 
} from "../utils/LoginProviders.js";
import NavbarBlanco from "../components/NavbarBlanco.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const { refetchUser } = useAuth()

  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();

      // Caso OK: ya autenticado con Google
      if (res.ok) {
        // Enviamos idToken al backend para crear sesión (cookie httpOnly)
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken: res.idToken }),
        });
        if (!response.ok) {
          // Si el usuario no existe, mostrar mensaje claro
          const data = await response.json().catch(() => null);
          if (data && data.error && data.error.includes("No existe una cuenta previa")) {
            setMsg("No existe una cuenta previa para este usuario. Debes registrarte primero con email y contraseña.");
            setLoading(false);
            return;
          }
          const text = await response.text();
          throw new Error(text || "Backend google login failed");
        }
        await refetchUser();
        navigate("/");
        return;
      }

      // Caso account exists -> necesitamos linkear
      if (res.accountExists) {
        const { email, pendingCred } = res;
        // pedir contraseña al usuario (reemplazar por modal)
        const pwd = window.prompt(
          `Se encontró una cuenta con ${email}. Ingresa tu contraseña para vincular Google a la cuenta existente:`
        );
        if (!pwd) {
          setMsg("Vinculación cancelada");
          setLoading(false);
          return;
        }

        // Autenticar con email/password
        const cred = await signInWithEmailAndPassword(auth, email, pwd);
        // Linkear la credencial pendiente (google) con este usuario
        await linkGoogleToExistingAccount(cred.user, pendingCred);

        // Tras linkear, obtenemos idToken y lo mandamos al backend
        const idToken = await cred.user.getIdToken(true);
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          if (data && data.error && data.error.includes("No existe una cuenta previa")) {
            setMsg("No existe una cuenta previa para este usuario. Debes registrarte primero con email y contraseña.");
            setLoading(false);
            return;
          }
          const text = await response.text();
          throw new Error(text || "Backend google login failed");
        }
        await refetchUser();
        navigate("/");
        return;
      }
    } catch (err) {
      console.error("Error en signInWithGoogle flow:", err);
      setMsg(err.message || "Error en login con Google");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const result = await loginAndSendToBackend(email, password);
      console.log("Backend auth result:", result);
      if(!result.user.uid){
        setMsg("Algo salió mal")
      }else{
        await refetchUser();
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setMsg(err.code?.replace(/-/g, ' ').replace('auth/', '') || JSON.parse(err.message).error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <NavbarBlanco />
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Iniciar sesión / Registro</h2>

        <div className="space-y-3">
          <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-2 bg-red-500 text-white rounded">
            Sign in with Google
          </button>
        </div>

        <hr className="my-4" />

        <form onSubmit={handleLoginEmail} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-2 border rounded" required />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Contraseña" className="w-full p-2 border rounded" required />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-gray-600 text-white rounded">Entrar</button>
          </div>
        </form>
        <div className="text-center">
          <em>No tienes una cuenta? <Link disabled={loading} to='/register' className="">Registrarse</Link></em>
        </div>
        {msg && <p className="mt-4 text-sm text-center text-red-500">{msg}</p>}
      </div>
    </div>
  );
}

export default Login;
