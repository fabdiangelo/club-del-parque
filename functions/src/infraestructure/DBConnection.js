import { db } from './FirebaseServices.js'

export default class DBConnection{
    constructor(){
        this.db = db;
    }

    // Método necesario para FirestoreReporteRepository
    collection(collectionName) {
        return this.db.collection(collectionName);
    }

    async getItem(collection, id){
        return await this.db.collection(collection).doc(id).get();
    }

    async putItem(collection, item, id){
        return await this.db.collection(collection).doc(id).set(item);
    }

    async addItem(collection, item){
        return await this.db.collection(collection).add(item);
    }
}