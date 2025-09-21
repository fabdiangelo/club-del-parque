import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthProvider";

import Navbar from "../components/Navbar.jsx";

import { loginAndSendToBackend, signInWithGoogle } from "../utils/LoginProviders.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const { refetchUser } = useAuth()

  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    setMsg(null);
    try {
      const result = await signInWithGoogle();
      console.log("Google auth result:", result);
      if(!result.user.uid){
        setMsg("Algo salió mal")
      }else{
        await refetchUser();
        navigate("/");
      }
    } catch (err) {
      console.error(Object.keys(err.customData));
      setMsg(err.code.replace(/-/g, ' ').replace('auth/', ''))
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
      if(!result.uid){
        setMsg("Algo salió mal")
      }else{
        await refetchUser();
        navigate("/");
      }
    } catch (err) {
      console.error(Object.keys(err.customData));
      setMsg(err.code.replace(/-/g, ' ').replace('auth/', ''))
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
