import DBConnection from "../ports/DBConnection.js";

export class UsuarioRepository {
    constructor() {
        this.db = new DBConnection();
    }

    async getUserById(userId) {
        return await this.db.getItem("usuarios", userId);
    }

    async getAllUsers() {
        const snapshot = await this.db.getAllItems("usuarios");
        const users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    }

    async update(id, usuario) {
        await this.db.putItem('usuarios', usuario, id);
    }

    async getCantUsuarios() {
        return await this.db.cantItems("usuarios");
    }

}