// functions/src/usecases/Usuarios/ActualizarUsuario.js
import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { AdministradorRepository } from "../../infraestructure/adapters/AdministradorRepository.js";

class ActualizarUsuario {
  constructor(){
    this.usuarioRepo = new UsuarioRepository();
    this.federadoRepo = new FederadoRepository();
    this.adminRepo = new AdministradorRepository();
  }

  async execute(uid, data) {
  try {
    if (data.rol && !["usuario", "federado", "administrador"].includes(data.rol)) {
      throw new Error("Rol inválido");
    }
    console.log("ActualizarUsuario data:", data);

    // Verificar existencia en las colecciones
    const usuarioExiste = await this.usuarioRepo.getUserById(uid).then(user => !!user).catch(() => false);
    const federadoExiste = await this.federadoRepo.getFederadoById(uid).then(fed => !!fed).catch(() => false);
    const adminExiste = await this.adminRepo.getAdministradorById(uid).then(admin => !!admin).catch(() => false);

    // Si no existe en ninguna colección, lanzar error
    if (!usuarioExiste && !federadoExiste && !adminExiste) {
      throw new Error("Usuario no encontrado en ninguna colección");
    }

    // Actualizar según el rol
    switch (data.rol) {
      case "usuario": {
        if (!usuarioExiste) throw new Error("Usuario no encontrado en la colección usuarios");
        await this.usuarioRepo.update(uid, { ...data, rol: "usuario" });
        break;
      }
      case "federado": {
        if (this.federadoRepo.upsert) {
          await this.federadoRepo.upsert(uid, { ...data, rol: "federado" });
        } else if (federadoExiste) {
          await this.federadoRepo.update(uid, { ...data, rol: "federado" });
        } else {
          await this.federadoRepo.create(uid, { ...data, rol: "federado" });
        }
        break;
      }
      case "administrador": {
        if (this.adminRepo.upsert) {
          await this.adminRepo.upsert(uid, { ...data, rol: "administrador" });
        } else if (adminExiste) {
          await this.adminRepo.update(uid, { ...data, rol: "administrador" });
        } else {
          await this.adminRepo.create(uid, { ...data, rol: "administrador" });
        }
        break;
      }
      default: {
        // Si no se especifica rol, actualizar donde exista el documento
        if (usuarioExiste) return await this.usuarioRepo.update(uid, data);
        if (federadoExiste) return await this.federadoRepo.update(uid, data);
        if (adminExiste) return await this.adminRepo.update(uid, data);
        throw new Error("No se encontró el documento del usuario en ninguna colección");
      }
    }

    return data;
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
}
}

export default new ActualizarUsuario();
