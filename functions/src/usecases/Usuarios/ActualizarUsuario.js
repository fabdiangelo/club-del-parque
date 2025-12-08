import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { AdministradorRepository } from "../../infraestructure/adapters/AdministradorRepository.js";
import AuthConnection from "../../infraestructure/ports/AuthConnection.js";

class ActualizarUsuario {
  constructor() {
    this.usuarioRepo = new UsuarioRepository();
    this.federadoRepo = new FederadoRepository();
    this.adminRepo = new AdministradorRepository();
    this.auth = new AuthConnection();
  }

  async execute(uid, data) {
    try {
      if (data.rol && !["usuario", "federado", "administrador"].includes(data.rol)) {
        throw new Error("Rol inválido");
      }

      console.log("ActualizarUsuario data:", data);

      const usuarioExiste = await this.usuarioRepo.getUserById(uid).then(u => !!u).catch(() => false);
      const federadoExiste = await this.federadoRepo.getFederadoById(uid).then(f => !!f).catch(() => false);
      const adminExiste   = await this.adminRepo.getAdministradorById(uid).then(a => !!a).catch(() => false);

      if (!usuarioExiste && !federadoExiste && !adminExiste) {
        throw new Error("Usuario no encontrado en ninguna colección");
      }

      // --- Actualizar Firestore según rol como ya hacías ---
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
          if (usuarioExiste) await this.usuarioRepo.update(uid, data);
          else if (federadoExiste) await this.federadoRepo.update(uid, data);
          else if (adminExiste) await this.adminRepo.update(uid, data);
          else throw new Error("No se encontró el documento del usuario en ninguna colección");
        }
      }

      // --- 🔐 Actualizar SIEMPRE Firebase Auth cuando venga email/password ---
      const authUpdate = {};
      if (data.email) authUpdate.email = data.email;
      if (data.password) authUpdate.password = data.password;

      if (Object.keys(authUpdate).length > 0) {
        await this.auth.updateUser(uid, authUpdate);
      }

      return data;
    } catch (err) {
      console.error("Error updating user:", err);
      throw err;
    }
  }
}

export default new ActualizarUsuario();
