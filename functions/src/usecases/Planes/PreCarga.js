import { PlanRepository } from "../../infraestructure/adapters/PlanRepository.js";
import Plan from "../../domain/entities/Plan.js";

class PreCarga {
  constructor() {
    this.planes = [
      { tipo: 'Mensual', frecuenciaRenovacion: 1 },
      { tipo: 'Semestral', frecuenciaRenovacion: 6 },
      { tipo: 'Anual', frecuenciaRenovacion: 12 },
    ];

    this.planRepository = new PlanRepository();
  }

  async execute() {
    try {
      for (const planData of this.planes) {
        const existingPlan = await this.planRepository.findById(planData.tipo);
        if (!existingPlan) {
          const plan = new Plan(planData.tipo, planData.tipo, planData.frecuenciaRenovacion);
          await this.planRepository.save(plan.toPlainObject());
          console.log(`Plan ${plan.tipo} creado.`);
        } else {
          console.log(`Plan ${planData.tipo} ya existe.`);
        }
      }
    } catch (err) {
      console.error("Error en precarga de planes:", err);
      throw err;
    }
  }
}

export default new PreCarga();