import admin from "firebase-admin";

export default class DBConnection{
    constructor(){
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        const db = admin.firestore();
        db.settings?.({ ignoreUndefinedProperties: true });

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