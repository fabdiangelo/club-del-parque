import DBConnection from "../ports/DBConnection.js";


export class UsuarioRepository {
    constructor() {
        this.db = new DBConnection();
    }


    getUserById(userId) {
        return this.db.getItem("usuarios", userId);
    }

    async getAllUsers() {
        const snapshot = await this.db.getAllItems("usuarios");
        const users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    }

}