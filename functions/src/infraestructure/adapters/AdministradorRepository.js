// functions/src/infraestructure/adapters/AdministradorRepository.js
import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

export class AdministradorRepository {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();
    this.collectionName = "administradores";
  }

  /* ---------------- helpers ---------------- */
  /** Accepts a Firestore DocumentSnapshot OR a plain object and returns a plain {id, ...data} */
  _asPlain(doc, fallbackId) {
    if (!doc) return null;

    // Firestore DocumentSnapshot?
    if (typeof doc.data === "function") {
      const data = doc.data() || {};
      return { id: doc.id ?? fallbackId, ...data };
    }

    // Already a plain object
    if (typeof doc === "object") {
      const id =
        doc.id ??
        doc.uid ??            // sometimes you store uid instead of id
        fallbackId ??
        undefined;
      // avoid duplicating id in the spread if it exists
      const { id: _omit, ...rest } = doc;
      return id ? { id, ...rest } : { ...rest };
    }

    return null;
  }

  async getAdministradorById(id) {
    const raw = await this.db.getItem(this.collectionName, id);
    if (!raw) return null;
    return this._asPlain(raw, id);
  }

  /* ---------------- CRUD ---------------- */
  async save(administrador) {
    const ref = await this.db.putItem(
      this.collectionName,
      administrador,
      administrador.id
    );
    // Some DBConnection impls return {id}, others may return void
    return ref?.id ?? administrador.id;
  }

  async create(email, password, displayName) {
    let userRecord;
    try {
      userRecord = await this.auth.createAdmin({ email, password, displayName });
    } catch (err) {
      if (
        err.code === "auth/email-already-exists" ||
        err.message?.includes("already exists")
      ) {
        userRecord = await this.auth.getUserByEmail(email);
      } else {
        throw err;
      }
    }
    return userRecord;
  }

  async findById(id) {
    const raw = await this.db.getItem(this.collectionName, id);
    if (!raw) return null;
    return this._asPlain(raw, id);
  }

  async update(id, administrador) {
    await this.db.updateItem(this.collectionName, id, administrador);

    if (administrador.email) {
      await this.auth.updateUser(id, { email: administrador.email });
    }
    if (administrador.password) {
      await this.auth.updateUser(id, { password: administrador.password });
    }
  }

  async getAll() {
    const rows = await this.db.getAllItems(this.collectionName);
    if (!rows) return [];
    return Array.from(rows).map((doc, i) => this._asPlain(doc, `admin-${i}`)).filter(Boolean);
  }

  async delete(id) {
    return this.db.deleteItem(this.collectionName, id);
  }
}
