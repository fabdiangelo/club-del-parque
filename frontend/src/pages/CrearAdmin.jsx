import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";

import NavbarBlanco from "../components/NavbarBlanco.jsx";

function CrearAdmin() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    apellido: "",
    estado: "",
    nacimiento: "",
    genero: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { register, error } = useAuth();

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    console.log("Registrando usuario:", formData);

    try {
      const ok = await register("api/administrador/register", formData);
      if (!ok) {
        throw new Error(error || "Error en el registro");
      }
      setSuccess("Usuario registrado con éxito ✅");
      setFormData({
        nombre: "",
        email: "",
        password: "",
        apellido: "",
        estado: "",
        nacimiento: "",
        genero: "",
      });
      navigate("/");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <NavbarBlanco />
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: "var(--neutro)" }}
        >
          Registro
        </h2>

        <form
          style={{ color: "var(--neutro)" }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Estado</label>
            <input
              type="text"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Nacimiento</label>
            <input
              type="date"
              name="nacimiento"
              value={formData.nacimiento}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Género</label>
            <input
              type="text"
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearAdmin;
