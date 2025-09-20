import { db } from './FirebaseServices.js'

export default class DBConnection{
    constructor(){
        this.db = db;
    }

    async getItem(collection, id){
        return await this.db.collection(collection).doc(id).get();
    }

    async putItem(collection, item, id){
        return await db.collection(collection).doc(id).set(item);
    }

    async putItem(collection, item){
        return await db.collection(collection).set(item);
    }
}