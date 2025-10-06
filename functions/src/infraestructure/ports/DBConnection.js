import { db } from '../FirebaseServices.js'

export default class DBConnection{
    constructor(){
        this.db = db;
    }

    // Método necesario para FirestoreReporteRepository
    collection(collectionName) {
        return this.db.collection(collectionName);
    }

    async addItem(collection, item) {
        return await this.db.collection(collection).add(item);
    }

    async getItem(collection, id){
        return await this.db.collection(collection).doc(id).get().then(doc => doc.data());
    }

    async getAllItems(collection) {
        return await this.db.collection(collection).get();
    }

    async putItem(collection, item, id = null) {
        if (id) {
            return await this.db.collection(collection).doc(id).set(item);
        } else {
            return await this.db.collection(collection).add(item);
        }
    }

    async cantItems(collection) {
        return await this.db.collection(collection).count().get().then((snapshot) => snapshot.data().count);
    }

    async getItemsByField(collection, field, value) {
        const snapshot = await this.db.collection(collection).where(field, '==', value).get();
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    }

    async getItemsWhereNotEqual(collection, field, value) {
        const snapshot = await this.db.collection(collection).where(field, '!=', value).get();
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    }

    async updateItem(collection, id, partial) {
        await this.db.collection(collection).doc(id).update(partial);
        return id;
    }
}