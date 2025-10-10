import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";

class ObtenerDatosUsuario {
  constructor(){
    this.campeonatoRepository = new CampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
  }
  async execute(id) {
    try{
      const campeonato = await this.campeonatoRepository.findById(id);
      const etapas = [];

      console.log(campeonato)
      for(let i = 0; i < campeonato.etapasIDs.length; i++){
        const etapaId = campeonato.etapasIDs[i]
        const etapa = await this.etapaRepository.findById(etapaId);
        etapa.indice = i;
        etapas.push(etapa);
      }
      return {...campeonato, etapas: etapas};
    
    } catch (err){
      console.error("auth verify error:", err);
      throw err;
    }
  }
}

export default new ObtenerDatosUsuario();