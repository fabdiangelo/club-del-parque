// src/usecases/noticias/ReemplazarImagenNoticia.js
export default class ReemplazarImagenNoticia {
  constructor(noticiaImageRepository) {
    this.noticiaImageRepository = noticiaImageRepository;
  }
  async execute(noticiaId, file) {
    if (!noticiaId) throw new Error('ReemplazarImagenNoticia: noticiaId requerido');
    if (!file?.buffer) throw new Error('ReemplazarImagenNoticia: archivo requerido');
    return this.noticiaImageRepository.replace(noticiaId, file);
  }
}
