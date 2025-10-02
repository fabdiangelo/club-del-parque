import { PlanRepository } from "../../infraestructure/adapters/PlanRepository.js";

class GetAllPlanes {
  constructor(){
    this.planRepository = new PlanRepository();
  }
  async execute() {
    try{
      const planes = await this.planRepository.getAllPlanes('planes');
      return planes;
    } catch (err){
      console.error("Error obteniendo planes:", err);
      throw err;
    }
  }
}

export default new GetAllPlanes();