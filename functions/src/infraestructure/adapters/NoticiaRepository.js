// src/infraestructure/adapters/NoticiaRepository.js
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

function sanitizeFileName(name = "uploaded") {
  return name.replace(/[^a-z0-9._-]+/gi, "_");
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

  /** CREATE — keeps legacy single image fields, initializes imagenes as [] */
  async create(noticia, image = null) {
    const n = noticia instanceof Noticia ? noticia : new Noticia(noticia);
    const plain = n.toPlainObject();

    const id = plain.id || (await this.db.addItem(COLLECTION, { __tmp: true }));
    const docRef = this.db.db.collection(COLLECTION).doc(id);

    let { imagenUrl = null, imagenPath = null } = plain;
    const now = this.db.serverTimestamp?.() ?? new Date().toISOString();

    const normalized = normalizeImageInput(image);
    if (normalized) {
      const dest = this.storage.buildDestination("noticias", id, sanitizeFileName(normalized.fileName));
      const uploaded = await this.storage.uploadBuffer(
        normalized.imageBuffer,
        dest,
        normalized.contentType || "image/jpeg",
        true
      );
      imagenUrl = uploaded.publicUrl;
      imagenPath = uploaded.storagePath;
    }

    await docRef.set(
      {
        nombre: plain.nombre,
        titulo: plain.titulo,
        tipo: plain.tipo,
        administradorID: plain.administradorID,
        mdContent: plain.mdContent,
        imagenUrl,         // legacy
        imagenPath,        // legacy
        imagenes: Array.isArray(plain.imagenes) ? plain.imagenes : [], // NEW array
        fechaCreacion: now,
        fechaActualizacion: now,
      },
      { merge: false }
    );

    return id;
  }

  /** UPDATE — can replace/remove legacy single-image; fields + fechaActualizacion */
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
      const dest = this.storage.buildDestination("noticias", id, sanitizeFileName(normalized.fileName));
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

  /** Legacy single setters */
  async setImage(id, image) {
    return this.update(id, {}, image, { replaceImage: true });
  }

  async removeImage(id) {
    return this.update(id, {}, null, { removeImage: true });
  }

  /** NEW — push one image into `imagenes` array */
  async addImage(id, image) {
    const normalized = normalizeImageInput(image);
    if (!normalized) throw new Error("addImage: invalid image");

    // Upload
    const fname = `${Date.now()}-${sanitizeFileName(normalized.fileName)}`;
    const dest = this.storage.buildDestination("noticias", id, fname);
    const uploaded = await this.storage.uploadBuffer(
      normalized.imageBuffer,
      dest,
      normalized.contentType || "image/jpeg",
      true
    );
    const entry = {
      imageUrl: uploaded.publicUrl,
      imagePath: uploaded.storagePath,
      uploadedAt: this.db.serverTimestamp?.() ?? new Date().toISOString(),
    };

    // Read current doc, append
    const snap = await this.db.getItem(COLLECTION, id);
    if (!snap || !snap.exists) throw new Error("Noticia not found");
    const data = snap.data() || {};
    const imagenes = Array.isArray(data.imagenes) ? data.imagenes : [];
    imagenes.push(entry);

    await this.db.updateItem(COLLECTION, id, {
      imagenes,
      fechaActualizacion: this.db.serverTimestamp?.() ?? new Date().toISOString(),
    });

    return entry; // { imageUrl, imagePath, uploadedAt }
  }

  /** NEW — remove a specific image either by imagePath or by index */
  async removeImageBy(id, { imagePath, index } = {}) {
    const snap = await this.db.getItem(COLLECTION, id);
    if (!snap || !snap.exists) throw new Error("Noticia not found");
    const data = snap.data() || {};
    const imagenes = Array.isArray(data.imagenes) ? data.imagenes.slice() : [];
    if (imagenes.length === 0) return false;

    let removed;
    if (typeof index === "number" && index >= 0 && index < imagenes.length) {
      removed = imagenes.splice(index, 1)[0];
    } else if (imagePath) {
      const idx = imagenes.findIndex((x) => x.imagePath === imagePath);
      if (idx === -1) return false;
      removed = imagenes.splice(idx, 1)[0];
    } else {
      throw new Error("removeImageBy: provide imagePath or index");
    }

    // Best-effort delete from storage
    if (removed?.imagePath) {
      await this.storage.delete(removed.imagePath).catch(() => {});
    }

    await this.db.updateItem(COLLECTION, id, {
      imagenes,
      fechaActualizacion: this.db.serverTimestamp?.() ?? new Date().toISOString(),
    });

    return true;
  }

  /** DELETE noticia (+ legacy single image + all multi images) */
  async delete(id) {
    const snap = await this.db.getItem(COLLECTION, id);
    if (snap && snap.exists) {
      const data = snap.data() || {};
      const legacyPath = data.imagenPath;
      const imgs = Array.isArray(data.imagenes) ? data.imagenes : [];
      if (legacyPath) await this.storage.delete(legacyPath).catch(() => {});
      for (const it of imgs) {
        if (it?.imagePath) await this.storage.delete(it.imagePath).catch(() => {});
      }
    }
    await this.db.deleteItem(COLLECTION, id);
    return id;
  }
}
