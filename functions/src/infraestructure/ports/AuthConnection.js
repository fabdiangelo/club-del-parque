import { auth } from '../FirebaseServices.js';

export default class AuthConnection{
    constructor(){
        this.auth = auth;
    }

    async createUser(user){
        const newUser = await this.auth.createUser(user)
        await this.auth.setCustomUserClaims(newUser.uid, { rol: "usuario" });

        return newUser;
    }

    async decodeToken(idToken){
        return await this.auth.verifyIdToken(idToken);
    }

    async setRole(uid, rol){
        console.log(`Setting role ${rol} for user ${uid}`);
        return await this.auth.setCustomUserClaims(uid, { rol });
    }

    async getUserByEmail(email){
        return await this.auth.getUserByEmail(email);
    }

    async updateUser(uid, updates){
        return await this.auth.updateUser(uid, updates);
    }
}