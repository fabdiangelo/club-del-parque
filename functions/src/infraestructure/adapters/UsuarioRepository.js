import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

export class UsuarioRepository {
    constructor() {
        this.db = new DBConnection();
        this.auth = new AuthConnection();
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
        const docRef = this.db.collection('usuarios').doc(id);

        await docRef.set(usuario, { merge: true });

        // Actualizar también el auth
        if (usuario.email) {
            await this.auth.updateUser(id, { email: usuario.email });
        }
        if (usuario.password) {
            await this.auth.updateUser(id, { password: usuario.password });
        }
    }

    async getCantUsuarios() {
        return await this.db.cantItems("usuarios");
    }

}