import INoticiaRepository from '../../domain/ports/INoticiaRepository.js';
import DBConnection from '../../infraestructure/DBConnection.js';
import StorageConnection from '../../infraestructure/ports/StorageConnection.js';
import Noticia from '../../domain/entities/Noticia.js';

const COLLECTION = 'noticias';

export default class NoticiaRepository extends INoticiaRepository {
  constructor({ db = new DBConnection(), storage = new StorageConnection() } = {}) {
    super();
    this.db = db;
    this.storage = storage;
  }

  async findById(id) {
    const snap = await this.db.getItem(COLLECTION, id);
    if (!snap.exists) return null;
    const data = { id: snap.id, ...snap.data() };
    return Noticia.fromData(data);
  }

  async findAll({ limit = 20, orderBy = [['fechaCreacion', 'desc']] } = {}) {
    const { items } = await this.db.query(COLLECTION, { orderBy, limit });
    return items.map((d) => Noticia.fromData(d));
  }

  async create(noticia, image) {
    const now = this.db.serverTimestamp();
    const plain = noticia.toPlainObject();
    const id = plain.id || (await this.db.addItem(COLLECTION, { __tmp: true })); // reserve id
    const docRef = this.db.db.collection(COLLECTION).doc(id);

    let imagenUrl = plain.imagenUrl || null;
    let imagenPath = plain.imagenPath || null;

    if (image?.imageBuffer && image?.fileName) {
      const dest = this.storage.buildDestination('noticias', id, image.fileName);
      const uploaded = await this.storage.uploadBuffer(image.imageBuffer, dest, image.contentType || 'image/jpeg', true);
      imagenUrl = uploaded.publicUrl;
      imagenPath = uploaded.storagePath;
    }

    const toSave = {
      nombre: plain.nombre,
      titulo: plain.titulo,
      tipo: plain.tipo,
      administradorID: plain.administradorID,
      mdContent: plain.mdContent,
      imagenUrl,
      imagenPath,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    await docRef.set(toSave, { merge: false });
    return id;
  }

  async update(id, partial, image) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Noticia not found');

    let imagenUrl = existing.imagenUrl || null;
    let imagenPath = existing.imagenPath || null;

    if (image?.imageBuffer && image?.fileName) {
      // replace image: optionally delete the old one
      if (image.replace && imagenPath) {
        await this.storage.delete(imagenPath);
      }
      const dest = this.storage.buildDestination('noticias', id, image.fileName);
      const uploaded = await this.storage.uploadBuffer(image.imageBuffer, dest, image.contentType || 'image/jpeg', true);
      imagenUrl = uploaded.publicUrl;
      imagenPath = uploaded.storagePath;
    }

    const toUpdate = {
      ...partial,
      ...(image ? { imagenUrl, imagenPath } : {}),
      fechaActualizacion: this.db.serverTimestamp(),
    };

    await this.db.updateItem(COLLECTION, id, toUpdate);
    return id;
  }

  async delete(id) {
    const existing = await this.findById(id);
    if (existing?.imagenPath) {
      await this.storage.delete(existing.imagenPath);
    }
    await this.db.deleteItem(COLLECTION, id);
    return id;
  }
}
