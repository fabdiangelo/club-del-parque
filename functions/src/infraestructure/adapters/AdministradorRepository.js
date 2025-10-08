import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

export class AdministradorRepository {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();
    this.collectionName = 'administradores';
  }

  async save(administrador) {
    const docRef = await this.db.putItem(this.collectionName, administrador);
    return docRef.id;
  }

  async create(email, password, displayName) {
    let userRecord;
    try {
      // Intentar crear usuario en Firebase Auth
      userRecord = await this.auth.createAdmin({
        email,
        password,
        displayName,
      });
    } catch (err) {
      // Si el error es que el email ya existe, obtener el usuario
      if (err.code === 'auth/email-already-exists' || err.message?.includes('already exists')) {
        userRecord = await this.auth.getUserByEmail(email);
      } else {
        throw err;
      }
    }
    return userRecord
  }

  async findById(id) {
    const administrador = await this.db.getItem(this.collectionName, id);
    if (!administrador) {
      return null;
    }
    return { id: administrador.id, ...administrador};
  }

  async update(id, administrador) {
    await this.db.updateItem("administradores", id, administrador)

    if (administrador.email) {
        await this.auth.updateUser(id, { email: administrador.email });
    }
    if (administrador.password) {
        await this.auth.updateUser(id, { password: administrador.password });
    }
  }

  async getAll(){
    const snapshot = await this.db.getAllItems(this.collectionName);
    const users = [];
    snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  }
}
