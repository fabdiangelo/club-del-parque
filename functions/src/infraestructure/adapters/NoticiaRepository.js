import INoticiaRepository from "../../domain/ports/INoticiaRepository.js";
import Noticia from "../../domain/entities/Noticia.js";
import DBConnection from "../DBConnection.js";
import StorageConnection from "../ports/StorageConnection.js";

const COLLECTION = "noticias";

function normalizeImageInput(input) {
  if (!input) return null;
  if (input.buffer && input.originalname) {
    return {
      imageBuffer: input.buffer,
      fileName: input.originalname,
      contentType: input.mimetype || "application/octet-stream",
    };
  }
  if (input.imageBuffer && input.fileName) return input;
  return null;
}

export default class NoticiaRepository extends INoticiaRepository {
  constructor({ db = new DBConnection(), storage = new StorageConnection() } = {}) {
    super();
    this.db = db;
    this.storage = storage;
  }

  async findById(id) {
    const snap = await this.db.getItem(COLLECTION, id);
    if (!snap || !snap.exists) return null;
    const data = { id: snap.id, ...snap.data() };
    return Noticia.fromData(data);
  }

  async findAll({ limit = 20, orderBy = [["fechaCreacion", "desc"]] } = {}) {
    const { items } = await this.db.query(COLLECTION, { orderBy, limit });
    return items.map((d) => Noticia.fromData(d));
  }

  async create(noticia, image = null) {
    const n = noticia instanceof Noticia ? noticia : new Noticia(noticia);
    const plain = n.toPlainObject();

    const id = plain.id || (await this.db.addItem(COLLECTION, { __tmp: true }));
    const docRef = this.db.db.collection(COLLECTION).doc(id);

    let { imagenUrl = null, imagenPath = null } = plain;

    const normalized = normalizeImageInput(image);
    if (normalized) {
      const dest = this.storage.buildDestination("noticias", id, normalized.fileName);
      const uploaded = await this.storage.uploadBuffer(
        normalized.imageBuffer,
        dest,
        normalized.contentType || "image/jpeg",
        true
      );
      imagenUrl = uploaded.publicUrl;
      imagenPath = uploaded.storagePath;
    }

    const now = this.db.serverTimestamp?.() ?? new Date().toISOString();
    await docRef.set(
      {
        nombre: plain.nombre,
        titulo: plain.titulo,
        tipo: plain.tipo,
        administradorID: plain.administradorID,
        mdContent: plain.mdContent,
        imagenUrl,
        imagenPath,
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      { merge: false }
    );

    return id;
  }

  async update(id, partial = {}, image = null, opts = {}) {
    const { replaceImage = !!image, removeImage = false } = opts;
    const existing = await this.findById(id);
    if (!existing) throw new Error("Noticia not found");

    let { imagenUrl = null, imagenPath = null } = existing;

    if (removeImage) {
      if (imagenPath) await this.storage.delete(imagenPath).catch(() => {});
      imagenUrl = null;
      imagenPath = null;
    }

    const normalized = normalizeImageInput(image);
    if (normalized) {
      if (replaceImage && imagenPath) {
        await this.storage.delete(imagenPath).catch(() => {});
      }
      const dest = this.storage.buildDestination("noticias", id, normalized.fileName);
      const uploaded = await this.storage.uploadBuffer(
        normalized.imageBuffer,
        dest,
        normalized.contentType || "image/jpeg",
        true
      );
      imagenUrl = uploaded.publicUrl;
      imagenPath = uploaded.storagePath;
    }

    await this.db.updateItem(COLLECTION, id, {
      ...partial,
      ...(removeImage || normalized ? { imagenUrl, imagenPath } : {}),
      fechaActualizacion: this.db.serverTimestamp?.() ?? new Date().toISOString(),
    });

    return id;
  }

  async setImage(id, image) {
    return this.update(id, {}, image, { replaceImage: true });
  }

  async removeImage(id) {
    return this.update(id, {}, null, { removeImage: true });
  }

  async delete(id) {
    const existing = await this.findById(id);
    if (existing?.imagenPath) {
      await this.storage.delete(existing.imagenPath).catch(() => {});
    }
    await this.db.deleteItem(COLLECTION, id);
    return id;
  }
}
