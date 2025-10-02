import DBConnection from "../ports/DBConnection.js";

class PlanRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async findById(id) {
    const plan = await this.db.getItem('planes', id);
    if (!plan) {
      return null;
    }
    return { id: plan.id, ...plan};
  }

  async save(plan) {
    const docRef = await this.db.putItem('planes', plan, plan.id);
    return docRef.id;
  }

  async getAllPlanes() {
    const snapshot = await this.db.getAllItems('planes');
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export { PlanRepository };