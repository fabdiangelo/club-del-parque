import { useState } from "react";
import { Link } from 'react-router-dom';

import Navbar from "../components/Navbar.jsx";

import { loginAndSendToBackend, signInWithGoogle } from "../utils/LoginProviders.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithGoogle();
      console.log("Login con Google OK:", res);
    } catch (err) {
      console.error("Error en login:", err);
    }
  };

  const handleLoginEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
        const result = await loginAndSendToBackend(email, password);
        console.log("Backend auth result:", result);
        // Guardar en estado global, redirigir según role, etc.
    } catch (err) {
        console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Navbar />
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
            <Link disabled={loading} to='/register' className="flex-1 py-2 bg-green-600 text-white rounded">Registrarse</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-gray-600 text-white rounded">Entrar</button>
          </div>
        </form>

        {msg && <p className="mt-4 text-sm text-center">{msg}</p>}
      </div>
    </div>
  );
}

export default Login;
