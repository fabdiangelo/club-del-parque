import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

class FederadoRepository {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();
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
    const docRef = await this.db.putItem('federados', federado, federado.id);
    return docRef.id;
  }

  async update(id, federado) {
    const docRef = this.db.collection('federados').doc(id);

    await docRef.set(federado, { merge: true });
    await this.auth.setRole(id, 'federado');
  }

  async agregarSubscripcion(id, subId) {
    console.log('Agregando subscripcion', subId, 'al federado', id);
    const federado = await this.db.getItem('federados', id);
    if (!federado) {
      throw new Error("Federado no encontrado");
    }
    if (!federado.subscripcionesIDs) {
      federado.subscripcionesIDs = [];
    }
    federado.subscripcionesIDs.unshift(subId);
    await this.db.putItem('federados', federado, id);
  }

  async getCantFederados() {
    return await this.db.cantItems("federados");
  }
}

export { FederadoRepository };