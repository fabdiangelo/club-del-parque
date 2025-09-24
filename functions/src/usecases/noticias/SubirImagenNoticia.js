// src/usecases/noticias/SubirImagenNoticia.js
export default class SubirImagenNoticia {
  constructor(noticiaImageRepository) {
    this.noticiaImageRepository = noticiaImageRepository;
  }
  async execute(noticiaId, file) {
    if (!noticiaId) throw new Error('SubirImagenNoticia: noticiaId requerido');
    if (!file?.buffer) throw new Error('SubirImagenNoticia: archivo requerido');
    return this.noticiaImageRepository.upload(noticiaId, file);
  }
}
