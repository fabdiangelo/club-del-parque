import Administrador from "../../domain/entities/Administrador.js";
import { AdministradorRepository } from "../../infraestructure/adapters/AdministradorRepository.js";

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto";

class CrearAdministrador {
  constructor() {
    this.administradorRepository = new AdministradorRepository();
  }

  async execute(administradorData) {
    console.log(administradorData)
    const administradorId = await this.administradorRepository.create(administradorData.email, administradorData.password, administradorData.nombre);
    console.log(administradorId)
    const newAdmin = new Administrador(
      administradorId.id,
      administradorData.email,
      administradorData.nombre,
      administradorData.apellido,
      "activo",
      administradorData.nacimiento,
      administradorData.genero,
      administradorData.superAdmin || false
    );
    await this.administradorRepository.save(newAdmin.toPlainObject())
    const payload = {
      uid: administradorId.id,
      email: administradorData.email,
      rol: "administrador",
      nombre:  administradorData.nombre,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
    return { token, user: payload };
  }
}

export default new CrearAdministrador();