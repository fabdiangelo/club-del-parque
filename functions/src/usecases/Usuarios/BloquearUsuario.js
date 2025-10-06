import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

class BloquearUsuario {
  constructor() {
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
  }
  async execute(uid) {
    const usuario = await this.usuarioRepository.getUserById(uid);
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }
    let estado = '';
    usuario.estado == 'activo' ? estado = 'inactivo' : estado = "activo";
    await this.usuarioRepository.update(uid, {estado});

    if (usuario.rol == 'federado'){
      const federado = await this.federadoRepository.getFederadoById(uid)
      if (!federado) {
        throw new Error("Federado no encontrado");
      }
      await this.federadoRepository.update(uid, {estado});
    }
    return estado;
  }
}

export default new BloquearUsuario();