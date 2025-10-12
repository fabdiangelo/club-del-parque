// functions/src/infraestructure/adapters/FederadoRepository.js
import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

class FederadoRepository {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();
    this.collection = "federados";
  }

  getFederadoById(userId) {
    return this.db.getItem(this.collection, userId);
  }

  async getAllFederados() {
    const res = await this.db.getAllItems(this.collection);

    // 1) Plain array of objects: [{ id, ...fields }]
    if (Array.isArray(res)) {
      // ensure each has id
      return res.map(row => ({ id: row.id, ...row }));
    }

    // 2) Firestore-like { docs: [...] }
    if (res && Array.isArray(res.docs)) {
      return res.docs.map(doc => {
        const data = typeof doc.data === "function" ? doc.data() : doc;
        return { id: doc.id, ...data };
      });
    }

    // 3) Firestore-like snapshot with .forEach
    if (res && typeof res.forEach === "function") {
      const out = [];
      res.forEach(doc => {
        const data = typeof doc.data === "function" ? doc.data() : doc;
        out.push({ id: doc.id, ...data });
      });
      return out;
    }

    // 4) Unknown shape → empty list
    return [];
  }

  async save(federado) {
    const docRef = await this.db.putItem(this.collection, federado, federado.id);
    return docRef.id || federado.id;
  }

  async update(id, federado) {
    return this.db.updateItem(this.collection, id, federado);
  }

  async agregarSubscripcion(id, subId) {
    console.log("Agregando subscripcion", subId, "al federado", id);
    const federado = await this.db.getItem(this.collection, id);
    if (!federado) throw new Error("Federado no encontrado");
    const subs = Array.isArray(federado.subscripcionesIDs) ? federado.subscripcionesIDs : [];
    subs.unshift(subId);
    federado.subscripcionesIDs = subs;
    await this.db.putItem(this.collection, federado, id);
  }

  async getCantFederados() {
    return this.db.cantItems(this.collection);
  }
}

export { FederadoRepository };
