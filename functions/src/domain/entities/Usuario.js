export default class Usuario {
  constructor(id, email, nombre, apellido, estado, nacimiento, genero, rol="usuario") {
    if (new.target === Usuario) {
        throw new Error("No se puede instanciar un usuario directamente")
    }
    
    this.id = id;
    this.email = email;
    this.nombre = nombre;
    this.apellido = apellido;
    this.estado = estado;
    this.nacimiento = nacimiento;
    this.genero = genero;
    this.notificacionesIDs = [];
    this.rol = rol;

    this.preferencias = {
      mail: true,
      whatsapp: true,
      tipos: {
        noticias: false,
        campeonatos: true,
        solicitudes: true,
      },
      tema: "light",
    };
  }

  toPlainObject() {
    return {
      id: this.id,
      email: this.email,
      nombre: this.nombre,
      apellido: this.apellido,
      estado: this.estado,
      nacimiento: this.nacimiento,
      genero: this.genero,
      notificacionesIDs: this.notificacionesIDs,
      rol: this.rol,
      preferencias: this.preferencias,
    };
  }
}