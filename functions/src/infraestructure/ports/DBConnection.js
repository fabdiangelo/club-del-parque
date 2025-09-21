import { db } from '../FirebaseServices.js'

export default class DBConnection{
    constructor(){
        this.db = db;
    }

    async getItem(collection, id){
        return await this.db.collection(collection).doc(id).get();
    }

    async putItem(collection, item, id = null) {
        if (id) {
            return await db.collection(collection).doc(id).set(item);
        } else {
            return await db.collection(collection).add(item);
        }
    }
}