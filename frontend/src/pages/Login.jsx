import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from '../components/NavbarBlanco.jsx';

import { 
  loginAndSendToBackend, 
  signInWithGoogle,
  linkGoogleToExistingAccount, 
} from "../utils/LoginProviders.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const { refetchUser, logout } = useAuth()

  const navigate = useNavigate()

  // Al entrar en la página de login, cerrar cualquier sesión existente
  useEffect(() => {
    (async () => {
      try {
        await logout();
      } catch (err) {
      }
    })();
  }, [logout]);

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

        const cred = await signInWithEmailAndPassword(auth, email, pwd);
        // Linkear la credencial pendiente (google) con este usuario
        await linkGoogleToExistingAccount(cred.user, pendingCred);

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


  const handlePrecarga = async () => {
    setLoading(true); setMsg(null);
    try {
      const response = await fetch("/api/federados/precarga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
    } catch (err) {
      console.error(err);
      setMsg(err.code?.replace(/-/g, ' ').replace('auth/', '') || JSON.parse(err.message).error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white">
      <NavbarBlanco />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded">
          <h2 className="text-center my-5" style={{fontSize: '30px', fontWeight: 'normal'}}>Login</h2>
         

          <form onSubmit={handleLoginEmail} className="space-y-3">
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-2 border rounded" required />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Contraseña" className="w-full p-2 border rounded" required />
            <div className="flex gap-2 flex-col items-center">
              <button type="submit" disabled={loading} className="py-2 text-white rounded w-full" style={{backgroundColor: 'var(--neutro)', padding: '10px 20px', cursor: 'pointer'}}>Acceder</button>
            </div>
          </form>
          
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', backgroundColor: 'var(--primario)', cursor: 'pointer', padding: '10px', borderRadius: '8px', color: 'white'}} onClick={handleGoogleLogin} disabled={loading} className="my-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <p>Iniciar sesion con Google</p>
          </div>
          <div className="text-center my-5">
            <p onClick={() => navigate("/register")} style={{fontSize: '14px', cursor: 'pointer', color: 'blue'}}>¿No tienes una cuenta? <Link disabled={loading} to='/register' className="">Registrarse</Link></p>
          </div>
		  
		  <button onClick={() => handlePrecarga()}>PRECARGAR</button>

        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;