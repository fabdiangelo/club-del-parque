import DBConnection from "../ports/DBConnection.js";

export class FederadoRepository {
  constructor() {
    this.db = new DBConnection();
  }

  getFederadoById(userId) {
    return this.db.getItem("federados", userId);
  }

  async getAllFederados() {
    const snapshot = await this.db.getAllItems("federados");
    const federados = [];
    snapshot.forEach((doc) => {
      federados.unshift({ id: doc.id, ...doc.data() });
    });
    return federados;
  }

  async save(federado) {
    const docRef = await this.db.putItem('federados', federado);
    return docRef.id;
  }

  async update(id, federado) {
    await this.db.putItem('federados', federado, id);
  }

  async agregarSubscripcion(id, plan) {
    const federado = await this.db.getItem('federados', id);
    if (!federado) {
      throw new Error("Federado no encontrado");
    }
    if (!federado.planes) {
      federado.planes = [];
    }
    federado.planes.push(plan);
    await this.db.putItem('federados', federado, id);
  }

}