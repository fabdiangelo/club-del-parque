// src/domain/ports/INoticiaRepository.js
export default class INoticiaRepository {
  async findById(id) { throw new Error("INoticiaRepository.findById not implemented"); }
  async findAll(options = {}) { throw new Error("INoticiaRepository.findAll not implemented"); }

  // Core create/update (image is optional and may be a multer-like file or normalized object)
  async create(noticia, image = null) { throw new Error("INoticiaRepository.create not implemented"); }
  async update(id, partial = {}, image = null, opts = {}) {
    // opts: { replaceImage?: boolean, removeImage?: boolean }
    throw new Error("INoticiaRepository.update not implemented");
  }

  // Legacy single-image helpers
  async setImage(id, image) { throw new Error("INoticiaRepository.setImage not implemented"); }
  async removeImage(id) { throw new Error("INoticiaRepository.removeImage not implemented"); }

  // NEW: multi-image helpers
  async addImage(id, image) { throw new Error("INoticiaRepository.addImage not implemented"); }
  async removeImageBy(id, ref) { // { imagePath } OR { index }
    throw new Error("INoticiaRepository.removeImageBy not implemented");
  }

  async delete(id) { throw new Error("INoticiaRepository.delete not implemented"); }
}
