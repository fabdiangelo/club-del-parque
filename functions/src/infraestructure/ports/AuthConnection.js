import { auth } from '../FirebaseService.js';

export default class AuthConnection{
    constructor(){
        this.auth = auth;
    }

    async decodeToken(idToken){
        return await this.auth.verifyIdToken(idToken);
    }
}