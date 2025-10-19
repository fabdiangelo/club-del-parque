import { db } from '../FirebaseServices.js'

export default class DBConnection{
    constructor(){
        this.db = db;
    }

    collection(collectionName) {
        return this.db.collection(collectionName);
    }

    async addItem(collection, item) {
        return await this.db.collection(collection).add(item);
    }

    async getItem(collection, id){
        console.log("DBConnection getItem called with collection:", collection, "id:", id);
        return await this.db.collection(collection).doc(id).get().then(doc => doc.data());
    }

    async getAllItems(collection) {
        return await this.db.collection(collection).get().then((snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            return items;
        });
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

    async getByField(collection, field, op, value) {
  if (op !== "==") throw new Error("Only '==' supported by getByField alias");
  return { items: await this.getItemsByField(collection, field, value) };
}

async getAllItemsList(collection) {
  return this.getAllItems(collection);
}

async getItemObject(collection, id) {
  const data = await this.getItem(collection, id);
  return data ? { id, ...data } : null;
}

    async getItemsWhereNotEqual(collection, field, value) {
        const snapshot = await this.db.collection(collection).where(field, '!=', value).get();
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    }

    async deleteItem(collection, id) {
        await this.db.collection(collection).doc(id).delete();
        return id;
    }

    async updateItem(collection, id, partial) {
        await this.db.collection(collection).doc(id).update(partial);
        const updatedDoc = await this.db.collection(collection).doc(id).get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }
}