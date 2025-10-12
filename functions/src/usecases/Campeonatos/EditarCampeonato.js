import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";

class ActualizarUsuario {
  constructor(){
    this.campeonatoRepository = new CampeonatoRepository();
  }

  async execute(id, data) {
    try{
      await this.campeonatoRepository.update(id, data);
      return data;
    } catch (err){
      console.error("Error updating user:", err);
      throw err;
    }
  }
}

export default new ActualizarUsuario();