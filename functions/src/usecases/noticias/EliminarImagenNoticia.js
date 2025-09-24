// src/usecases/noticias/EliminarImagenNoticia.js
export default class EliminarImagenNoticia {
  constructor(noticiaImageRepository) {
    this.noticiaImageRepository = noticiaImageRepository;
  }
  async execute(noticiaId) {
    if (!noticiaId) throw new Error('EliminarImagenNoticia: noticiaId requerido');
    await this.noticiaImageRepository.remove(noticiaId);
  }
}
