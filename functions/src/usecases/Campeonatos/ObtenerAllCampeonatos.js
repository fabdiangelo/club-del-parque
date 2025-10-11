import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";

class ObtenerAllCampeonatos {
  constructor(){
    this.campeonatoRepository = new CampeonatoRepository();
  }
  async execute() {
    try{
      return await this.campeonatoRepository.getAll();
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new ObtenerAllCampeonatos();