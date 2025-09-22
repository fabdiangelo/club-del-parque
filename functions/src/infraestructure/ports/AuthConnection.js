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
}