export default class Blog{
    constructor (id, nombre, titulo, tipo, administradorID, mdContent) {
        this.id = id;
        this.nombre = nombre;
        this.titulo = titulo;
        this.tipo = tipo;
        this.administradorID = administradorID;
        this.mdContent = mdContent;
    }
    
    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            titulo: this.titulo,
            tipo: this.tipo,
            administradorID: this.administradorID,
            mdContent: this.mdContent,
        };
    }
}