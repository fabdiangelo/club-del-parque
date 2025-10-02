import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

class GetCantUsuarios {
  constructor() {
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
  }
  async execute() {
    const usuarios =  await this.usuarioRepository.getCantUsuarios();
    const federados =  await this.federadoRepository.getCantFederados();
    return {usuarios, federados};
  }
}

export default new GetCantUsuarios();