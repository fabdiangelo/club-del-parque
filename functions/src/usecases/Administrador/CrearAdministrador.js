import Administrador from "../../domain/entities/Administrador.js";
import { AdministradorRepository } from "../../infraestructure/adapters/AdministradorRepository.js";

class CrearAdministrador {
  constructor() {
    this.administradorRepository = new AdministradorRepository();
  }

  async execute(administradorData) {
    const newAdmin = new Administrador(
      administradorData.id,
      administradorData.email,
      administradorData.nombre,
      administradorData.apellido,
      "activo",
      administradorData.nacimiento,
      administradorData.genero,
      administradorData.superAdmin || false
    );
    const administradorId = await this.administradorRepository.save(newAdmin.toPlainObject());
    return administradorId;
  }
}

export default new CrearAdministrador();