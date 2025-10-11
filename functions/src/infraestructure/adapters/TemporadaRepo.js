// src/adapters/TemporadaRepo.js
import DBConnection from "../ports/DBConnection.js";

const COL = "temporadas";
const dbc = new DBConnection();

export const TemporadaRepo = {
  async create(data) {
    const ref = await dbc.addItem(COL, { ...data, createdAt: Date.now() });
    const id = ref.id; // Firestore DocumentReference
    await dbc.updateItem(COL, id, { id });
    const doc = await dbc.getItem(COL, id); // returns data() only
    return { id, ...doc };
  },

  async list() {
    // getAllItems returns a QuerySnapshot
    const snap = await dbc.getAllItems(COL);
    // If you want it sorted by inicio desc at the repo level, sort here:
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => String(b.inicio).localeCompare(String(a.inicio)));
    return items;
  },

  async getActive() {
    // Uses your convenience method; returns array of { id, ...data }
    const items = await dbc.getItemsByField(COL, "estado", "activa");
    if (!items || items.length === 0) return null;
    // If more than one somehow, pick the most recent by inicio desc
    items.sort((a, b) => String(b.inicio).localeCompare(String(a.inicio)));
    return items[0];
  },

  async setActiveById(id) {
    // Deactivate all current actives, activate the target in a single batch
    const actives = await dbc.getItemsByField(COL, "estado", "activa");
    const batch = dbc.db.batch();

    // Deactivate any currently active temporadas
    for (const a of actives) {
      const aref = dbc.collection(COL).doc(a.id);
      batch.update(aref, { estado: "inactiva" });
    }

    // Activate the requested temporada
    const targetRef = dbc.collection(COL).doc(id);
    batch.update(targetRef, { estado: "activa" });

    await batch.commit();

    const doc = await dbc.getItem(COL, id);
    return { id, ...doc };
  },

  async setEstado(id, estado) {
    await dbc.updateItem(COL, id, { estado });
    const doc = await dbc.getItem(COL, id);
    return { id, ...doc };
  },
};
