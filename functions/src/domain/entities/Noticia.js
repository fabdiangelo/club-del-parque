export default class Noticia {
  constructor({
    id,
    nombre,
    titulo,
    tipo,
    administradorID,
    mdContent,
    imagenUrl,
    imagenPath,
    imagenes, 
    fechaCreacion,
    fechaActualizacion,
  }) {
    this.id = id ?? null;
    this.nombre = nombre ?? "";
    this.titulo = titulo ?? "";
    this.tipo = tipo ?? "";
    this.administradorID = administradorID ?? "";
    this.mdContent = mdContent ?? "";
    this.imagenUrl = imagenUrl ?? null;     
    this.imagenPath = imagenPath ?? null;  
    this.imagenes = Array.isArray(imagenes) ? imagenes : []; 
    this.fechaCreacion = fechaCreacion ?? new Date().toISOString();
    this.fechaActualizacion = fechaActualizacion ?? new Date().toISOString();
  }

  touch() {
    this.fechaActualizacion = new Date().toISOString();
  }

  toPlainObject() {
    return {
      id: this.id ?? undefined,
      nombre: this.nombre,
      titulo: this.titulo,
      tipo: this.tipo,
      administradorID: this.administradorID,
      mdContent: this.mdContent,
      imagenUrl: this.imagenUrl,
      imagenPath: this.imagenPath,
      imagenes: this.imagenes,
      fechaCreacion: this.fechaCreacion,
      fechaActualizacion: this.fechaActualizacion,
    };
  }

  static fromData(data) {
    return new Noticia({
      id: data.id,
      nombre: data.nombre,
      titulo: data.titulo,
      tipo: data.tipo,
      administradorID: data.administradorID,
      mdContent: data.mdContent,
      imagenUrl: data.imagenUrl,
      imagenPath: data.imagenPath,
      imagenes: data.imagenes,
      fechaCreacion: data.fechaCreacion,
      fechaActualizacion: data.fechaActualizacion,
    });
  }
}
