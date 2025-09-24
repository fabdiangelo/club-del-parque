// Interface-style base class (JS) for Noticia repositories.
// Each method throws unless implemented.

export default class INoticiaRepository {
  // Queries
  async findById(id) { throw new Error("INoticiaRepository.findById not implemented"); }
  async findAll(options = {}) { throw new Error("INoticiaRepository.findAll not implemented"); }

  // Creates/updates core fields; may take an optional image
  // image can be a Multer file ({buffer, originalname, mimetype})
  // or { imageBuffer, fileName, contentType }
  async create(noticia, image = null) { throw new Error("INoticiaRepository.create not implemented"); }
  async update(id, partial = {}, image = null, opts = {}) {
    // opts: { replaceImage?: boolean, removeImage?: boolean }
    throw new Error("INoticiaRepository.update not implemented");
  }

  // Image-only helpers
  async setImage(id, image) { throw new Error("INoticiaRepository.setImage not implemented"); }
  async removeImage(id) { throw new Error("INoticiaRepository.removeImage not implemented"); }

  // Delete noticia (+ image if present)
  async delete(id) { throw new Error("INoticiaRepository.delete not implemented"); }
}
