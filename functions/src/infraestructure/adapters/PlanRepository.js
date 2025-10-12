// functions/src/infraestructure/adapters/PlanRepository.js
import DBConnection from "../ports/DBConnection.js";

class PlanRepository {
  constructor() {
    this.db = new DBConnection();
    this.collection = "planes";
  }

  // normalize any doc/snapshot/plain object into { id, ...data }
  _toPlain(doc, fallbackId) {
    if (!doc) return null;

    // Firestore DocumentSnapshot?
    if (typeof doc.data === "function") {
      const data = doc.data() || {};
      return { id: doc.id ?? fallbackId, ...data };
    }

    // Already a plain object
    if (typeof doc === "object") {
      const id = doc.id ?? doc.uid ?? fallbackId;
      const { id: _omit, ...rest } = doc;
      return id ? { id, ...rest } : { ...rest };
    }

    return null;
  }

  async findById(id) {
    const raw = await this.db.getItem(this.collection, id);
    return this._toPlain(raw, id);
  }

  async save(plan) {
    const ref = await this.db.putItem(this.collection, plan, plan.id);
    return ref?.id ?? plan.id;
  }

  async getAllPlanes() {
    const result = await this.db.getAllItems(this.collection);
    if (!result) return [];

    // Firestore QuerySnapshot with .docs
    if (Array.isArray(result?.docs)) {
      return result.docs.map((doc) => this._toPlain(doc)).filter(Boolean);
    }

    // Firestore QuerySnapshot with .forEach
    if (typeof result.forEach === "function" && !Array.isArray(result)) {
      const out = [];
      result.forEach((doc) => {
        const row = this._toPlain(doc);
        if (row) out.push(row);
      });
      return out;
    }

    // Array (of snapshots or plain objects)
    if (Array.isArray(result)) {
      return result.map((doc, i) => this._toPlain(doc, `plan-${i}`)).filter(Boolean);
    }

    // Object map { id: {...}, ... }
    return Object.entries(result)
      .map(([k, v]) => this._toPlain({ id: k, ...(typeof v === "object" ? v : {}) }, k))
      .filter(Boolean);
  }
}

export { PlanRepository };
