import INoticiaImageRepository from '../../domain/ports/INoticiaImageRepository.js';
import DBConnection from '../ports/DBConnection.js';
import StorageConnection from '../ports/StorageConnection.js';

export class NoticiaImageRepository extends INoticiaImageRepository {
  constructor({
    db = new DBConnection(),
    storage = new StorageConnection(),
    baseDir = 'noticias',
    collection = 'noticias',
  } = {}) {
    super();
    this.db = db;
    this.storage = storage;
    this.baseDir = baseDir;
    this.collection = collection;
  }

  /**
   * Uploads the image for a noticia that doesn't have one yet.
   * - file: { buffer, mimetype, originalname }
   * Returns: { imageUrl, imagePath }
   */
  async upload(noticiaId, file) {
    if (!file || !file.buffer) {
      throw new Error('NoticiaImageRepository.upload: file buffer is required');
    }

    const destPath = this.storage.buildDestination(this.baseDir, noticiaId, file.originalname);
    const { publicUrl, storagePath } = await this.storage.uploadBuffer(
      file.buffer,
      destPath,
      file.mimetype
    );

    // persist in Firestore
    await this.db.updateItem(this.collection, noticiaId, {
      imageUrl: publicUrl,
      imagePath: storagePath,
      fechaActualizacion: this.db.serverTimestamp?.() ?? new Date().toISOString(),
    });

    return { imageUrl: publicUrl, imagePath: storagePath };
  }

  /**
   * Replaces (or sets) the image:
   * - Deletes previous image if exists.
   * - Uploads the new one and updates the doc.
   */
  async replace(noticiaId, file) {
    const current = await this.db.getItem(this.collection, noticiaId);
    if (!current) throw new Error('Noticia no encontrada');

    // delete previous image if present
    if (current.imagePath) {
      await this.storage.delete(current.imagePath).catch(() => {});
    }

    return this.upload(noticiaId, file);
  }

  /**
   * Removes image fields from Firestore and deletes the file from storage (if present).
   */
  async remove(noticiaId) {
    const current = await this.db.getItem(this.collection, noticiaId);
    if (!current) return;

    if (current.imagePath) {
      await this.storage.delete(current.imagePath).catch(() => {});
    }

    await this.db.updateItem(this.collection, noticiaId, {
      imageUrl: this.db.FieldValue?.delete ? this.db.FieldValue.delete() : null,
      imagePath: this.db.FieldValue?.delete ? this.db.FieldValue.delete() : null,
      fechaActualizacion: this.db.serverTimestamp?.() ?? new Date().toISOString(),
    });
  }
}

export default NoticiaImageRepository;
