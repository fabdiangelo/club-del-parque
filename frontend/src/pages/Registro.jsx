import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import Footer from "../components/Footer.jsx";

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    apellido: "",
    estado: "",
    nacimiento: "",
    genero: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { register, error } = useAuth()

  function formatDate(date) {
    if (!date) return ""; // Maneja el caso de valores vacíos
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    setFormData({ ...formData, estado: "activo" });

    console.log("Registrando usuario:", formData);

    try {
      const ok = await register(import.meta.env.VITE_BACKEND_URL + "/api/auth/register", formData)
      if (!ok) {
        throw new Error(ok || "Error en el registro");
      }
      setSuccess("Usuario registrado con éxito ✅");
      setFormData({ nombre: "", email: "", password: "" });
      navigate("/");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavbarBlanco />
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white p-8 rounded md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--neutro)', fontSize: '30px', fontWeight: 'normal' }}>Registro</h2>
          <form style={{ color: 'var(--neutro)' }} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                placeholder="Nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <input
                placeholder="Apellido"
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <input
                placeholder="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <input
                placeholder="Contraseña"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <input
                placeholder="Nacimiento"
                type="date"
                name="nacimiento"
                value={formData.nacimiento} // Mantén el formato yyyy-mm-dd aquí
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded focus:ring focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <select value={formData.genero} onChange={handleChange} name="genero" className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300 mb-2">

                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <div className="flex gap-2 flex-col items-center">
              <button
                type="submit"
                disabled={loading}
                className="py-2 text-white rounded w-full"
                style={{ backgroundColor: 'var(--neutro)', padding: '10px 20px', cursor: 'pointer' }}
              >
                {loading ? "Registrando..." : "Registrarse"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Registro;