export default class Usuario {
  constructor(id, email, nombre, apellido, estado, nacimiento, genero) {
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
    this.rol = "usuario";
  }
}