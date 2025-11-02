import DBConnection from "../ports/DBConnection.js";
import StorageConnection from "../ports/StorageConnection.js";
import path from "path";

class CampeonatoRepository {
  constructor() {
    this.db = new DBConnection();
    this.storage = new StorageConnection();
  }

  async save(campeonato) {
    const docRef = await this.db.putItem('campeonatos', campeonato, campeonato.id);
    return docRef.id;
  }

  async findById(id) {
    const item = await this.db.getItem('campeonatos', id);
    if (!item) return null;
    return { id: item.id, ...item };
  }

  async getAll() {
    return await this.db.getAllItems('campeonatos');
  }

  async update(campeonatoId, campeonato) {
    return await this.db.updateItem("campeonatos", campeonatoId, campeonato);
  }

  /** Upload or replace reglamento PDF for a campeonato */
  async setReglamento(id, file) {
    if (!id) throw new Error('id requerido');
    const snap = await this.db.getItem('campeonatos', id);
    if (!snap) throw new Error('Campeonato no encontrado');
    const data = snap || {};

    // If file is null, remove existing reglamento
    if (!file) {
      if (data.reglamentoPath) {
        await this.storage.delete(data.reglamentoPath).catch(() => {});
      }
      await this.db.updateItem('campeonatos', id, { reglamentoUrl: null, reglamentoPath: null });
      return { reglamentoUrl: null, reglamentoPath: null };
    }

    // Normalize multer file object
    const buffer = file.buffer || null;
    const originalName = file.originalname || file.name || 'reglamento.pdf';
    const contentType = file.mimetype || 'application/pdf';

    if (!buffer) throw new Error('Archivo inválido');

    // delete old
    if (data.reglamentoPath) await this.storage.delete(data.reglamentoPath).catch(() => {});

    const dest = this.storage.buildDestination('campeonatos', id, originalName);
    let uploaded;
    try {
      uploaded = await this.storage.uploadBuffer(buffer, dest, contentType);
    } catch (err) {
      console.error('[CampeonatoRepository] uploadBuffer error:', err);
      throw err;
    }

    await this.db.updateItem('campeonatos', id, { reglamentoUrl: uploaded.publicUrl, reglamentoPath: uploaded.storagePath });
    return { reglamentoUrl: uploaded.publicUrl, reglamentoPath: uploaded.storagePath };
  }
}

export { CampeonatoRepository };
