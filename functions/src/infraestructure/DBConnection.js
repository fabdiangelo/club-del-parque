// /functions/src/ports/DBConnection.js
import {
  db as defaultDb,
  FieldValue as defaultFieldValue,
  Timestamp as defaultTimestamp,
} from './FirebaseServices.js';

export default class DBConnection {
  constructor({ db = defaultDb, FieldValue = defaultFieldValue, Timestamp = defaultTimestamp } = {}) {
    if (!db) throw new Error('DBConnection: Firestore `db` instance is required');
    this.db = db;
    this.FieldValue = FieldValue;
    this.Timestamp = Timestamp;
  }

  _docToObject(docSnap) {
    if (!docSnap || !docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  _querySnapToList(querySnap) {
    if (!querySnap) return [];
    return querySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  serverTimestamp() {
    return this.FieldValue?.serverTimestamp ? this.FieldValue.serverTimestamp() : new Date();
  }

  increment(by = 1) {
    return this.FieldValue?.increment ? this.FieldValue.increment(by) : by;
  }

  async getItem(collection, id) {
    return await this.db.collection(collection).doc(id).get();
  }

  async putItem(collection, item, id) {
    if (typeof id === 'string' && id) {
      await this.db.collection(collection).doc(id).set(item);
      return id;
    }
    const ref = await this.db.collection(collection).add(item);
    return ref.id;
  }

  async getAllItems(collection) {
    return await this.db.collection(collection).get();
  }

  async getItemObject(collection, id) {
    const snap = await this.db.collection(collection).doc(id).get();
    return this._docToObject(snap);
  }

  async addItem(collection, item) {
    const ref = await this.db.collection(collection).add(item);
    return ref.id;
  }

  async updateItem(collection, id, partial) {
    await this.db.collection(collection).doc(id).update(partial);
    return id;
  }

  async setItem(collection, id, data, { merge = true } = {}) {
    await this.db.collection(collection).doc(id).set(data, { merge });
    return id;
  }

  async deleteItem(collection, id) {
    await this.db.collection(collection).doc(id).delete();
    return id;
  }

  async getAllItemsList(collection) {
    const snap = await this.db.collection(collection).get();
    return this._querySnapToList(snap);
  }

  async query(collection, options = {}) {
    let q = this.db.collection(collection);

    if (Array.isArray(options.where)) {
      for (const [field, op, value] of options.where) q = q.where(field, op, value);
    }

    if (Array.isArray(options.orderBy)) {
      for (const [field, direction] of options.orderBy) q = q.orderBy(field, direction);
    }

    if (options.startAfter) q = q.startAfter(options.startAfter);
    if (options.startAt) q = q.startAt(options.startAt);
    if (options.endAt) q = q.endAt(options.endAt);
    if (options.endBefore) q = q.endBefore(options.endBefore);
    if (options.limit) q = q.limit(options.limit);

    const snap = await q.get();
    return {
      items: this._querySnapToList(snap),
      snapshot: snap,
      lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
  }

  async getByField(collection, field, op, value, { orderBy, limit } = {}) {
    return this.query(collection, {
      where: [[field, op, value]],
      orderBy,
      limit,
    });
  }

  async collectionGroup(groupId, options = {}) {
    let q = this.db.collectionGroup(groupId);

    if (Array.isArray(options.where)) {
      for (const [field, op, value] of options.where) q = q.where(field, op, value);
    }

    if (Array.isArray(options.orderBy)) {
      for (const [field, direction] of options.orderBy) q = q.orderBy(field, direction);
    }

    if (options.limit) q = q.limit(options.limit);

    const snap = await q.get();
    return {
      items: this._querySnapToList(snap),
      snapshot: snap,
      lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
  }

  async paginateQuery(
    collection,
    { where = [], orderBy = [['fechaCreacion', 'desc']] } = {},
    pageSize = 10,
    pageToken = null
  ) {
    let q = this.db.collection(collection);

    for (const [f, op, val] of where) q = q.where(f, op, val);
    for (const [f, dir] of orderBy) q = q.orderBy(f, dir);

    if (pageToken) q = q.startAfter(pageToken);
    q = q.limit(pageSize);

    const snap = await q.get();
    const items = this._querySnapToList(snap);
    const lastDoc = snap.docs[snap.docs.length - 1] || null;

    return {
      items,
      nextPageToken: lastDoc || null,
      lastDoc,
    };
  }

  async runTransaction(fn) {
    return this.db.runTransaction(async (tx) => {
      const helper = {
        get: async (collection, id) => {
          const snap = await tx.get(this.db.collection(collection).doc(id));
          return this._docToObject(snap);
        },
        set: (collection, id, data, { merge = true } = {}) =>
          tx.set(this.db.collection(collection).doc(id), data, { merge }),
        update: (collection, id, partial) =>
          tx.update(this.db.collection(collection).doc(id), partial),
        delete: (collection, id) =>
          tx.delete(this.db.collection(collection).doc(id)),
      };
      return fn(tx, helper);
    });
  }

  newBatch() {
    const batch = this.db.batch();
    return {
      set: (collection, id, data, { merge = true } = {}) =>
        batch.set(this.db.collection(collection).doc(id), data, { merge }),
      update: (collection, id, partial) =>
        batch.update(this.db.collection(collection).doc(id), partial),
      delete: (collection, id) =>
        batch.delete(this.db.collection(collection).doc(id)),
      commit: () => batch.commit(),
      _raw: batch,
    };
  }
}
