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

      // helpers opcionales (impleméntalos en cada repo)
      const usuarioExiste   = await this.usuarioRepo.exists?.(uid).catch(() => false);
      const federadoExiste  = await this.federadoRepo.exists?.(uid).catch(() => false);
      const adminExiste     = await this.adminRepo.exists?.(uid).catch(() => false);

      switch (data.rol) {
        case "usuario": {
          if (!usuarioExiste) throw new Error("Usuario no encontrado");
          await this.usuarioRepo.update(uid, { ...data, rol: "usuario" });
          break;
        }
        case "federado": {
          // ¡NO tocar colección usuarios!
          if (this.federadoRepo.upsert) {
            await this.federadoRepo.upsert(uid, { ...data, rol: "federado" });
          } else if (federadoExiste) {
            await this.federadoRepo.update(uid, { ...data, rol: "federado" });
          } else {
            // si no tenés upsert, proveé un create en tu repo
            await this.federadoRepo.create(uid, { ...data, rol: "federado" });
          }
          break;
        }
        case "administrador": {
          if (!adminExiste && !this.adminRepo.upsert) {
            await this.adminRepo.update(uid, { ...data, rol: "administrador" }); // o create/upsert si corresponde
          } else if (this.adminRepo.upsert) {
            await this.adminRepo.upsert(uid, { ...data, rol: "administrador" });
          }
          break;
        }
        default: {
          // Si no vino rol, actualizá donde exista el doc
          if (usuarioExiste)      return await this.usuarioRepo.update(uid, data);
          if (federadoExiste)     return await this.federadoRepo.update(uid, data);
          if (adminExiste)        return await this.adminRepo.update(uid, data);
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
