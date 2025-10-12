import DBConnection from "../../infraestructure/ports/DBConnection.js";
import AuthConnection from "../../infraestructure/ports/AuthConnection.js";
import Registrado from "../../domain/entities/Registrado.js";
import Federado from "../../domain/entities/Federado.js";
import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { SubscripcionRepository } from "../../infraestructure/adapters/SubscripcionRepository.js";

// Lista de nombres y apellidos realistas (32)
const maleNames = [
  "Mateo","Lucas","Matías","Diego","Joaquín","Samuel","Emiliano","Thiago",
  "Federico","Nicolás","Bruno","Santiago","Facundo","Agustín","Martín","Tomás"
];

const femaleNames = [
  "Sofía","Valentina","Isabella","Camila","María","Victoria","Antonella","Lucía",
  "Martina","Amanda","Gabriela","Julia","Florencia","Agustina","Carolina","Paula"
];

const apellidos = [
  "González","Rodríguez","Gómez","Fernández","López","Martínez","Sánchez","Pérez",
  "Romero","Torres","Ruiz","Flores","Vega","Rossi","Alvarez","Silva",
  "Morales","Herrera","Molina","Ortiz","Ibarra","Costa","Díaz","Navarro",
  "García","Cáceres","Benítez","Ramos","Luna","Suárez","Córdoba","Medina"
];

class PrecargaFederados {
  constructor(){
    this.db = new DBConnection();
    this.auth = new AuthConnection();
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
    this.password = "Q1w2e3r4!";
  }

  async execute(){
    try{
      for(let i = 1; i <= 32; i++){
        const email = `${i}@fed`;
        // Decide género y nombre acorde
        const isMale = i % 2 === 0; // alternar para diversidad
        const nombre = isMale ? maleNames[(i/2 - 1) % maleNames.length] : femaleNames[((i-1)/2) % femaleNames.length];
        const apellido = apellidos[(i-1) % apellidos.length];
        const genero = isMale ? 'masculino' : 'femenino';
        const nacimiento = randomDate(new Date(1980,0,1), new Date(2015,11,31)).toISOString();
        // Check if auth user exists
        let userRecord;
        try{
          userRecord = await this.auth.createUser({
            email,
            password: this.password,
            displayName: `${nombre} ${apellido}`
          });
          console.log(`Auth creado para ${email} -> uid ${userRecord.uid}`);
        }catch(err){
          if(err.code === 'auth/email-already-exists' || err.message?.includes('already exists')){
            userRecord = await this.auth.getUserByEmail(email);
            console.log(`Auth ya existente para ${email} -> uid ${userRecord.uid}`);
          }else{
            console.error(`Error creando auth para ${email}:`, err);
            throw err;
          }
        }

        // Asegurar custom claims: rol = federado
        try{
          await this.auth.setRole(userRecord.uid, 'federado');
          console.log(`Custom claim 'rol:federado' asignado a ${userRecord.uid}`);
        }catch(err){
          console.error(`Error asignando rol a ${userRecord.uid}:`, err);
          throw err;
        }

        // Create usuario record if not exists
        const existsUsuario = await this.db.getItem("usuarios", userRecord.uid);
        if(!existsUsuario){
          const usuario = new Registrado(
            userRecord.uid,
            email,
            nombre,
            apellido,
            "activo",
            nacimiento,
            genero
          );
          await this.db.putItem("usuarios", usuario.toPlainObject(), userRecord.uid);
          console.log(`Usuario creado en Firestore para ${email}`);
        } else {
          console.log(`Usuario ya existe en Firestore para ${email}`);
        }

        const hoy = new Date();
        // Create federado record if not exists
        const existsFed = await this.federadoRepository.getFederadoById(userRecord.uid);
        if(!existsFed){
          const federado = new Federado(
            userRecord.uid,
            email,
            nombre,
            apellido,
            "activo",
            nacimiento,
            genero
          );
          await this.federadoRepository.save(federado.toPlainObject());
          await this.federadoRepository.update(federado.id, {
            ...federado,
            estado: "activo",
            validoHasta: new Date(hoy.setMonth(hoy.getMonth() + 1)).toISOString(),
          });
          console.log(`Federado creado para ${email}`);
        } else {
          console.log(`Federado ya existe para ${email}`);
          if(existsFed.validoHasta < new Date()){
            await this.federadoRepository.update(existsFed.id, {
              ...existsFed,
              estado: "activo",
              validoHasta: new Date(hoy.setMonth(hoy.getMonth() + 1)).toISOString(),
            });

          }
        }
      }
    }catch(err){
      console.error("Error en precarga de federados:", err);
      throw err;
    }
  }
}

export default new PrecargaFederados();

// helper: random date between start and end
function randomDate(start, end){
  const s = start.getTime();
  const e = end.getTime();
  const t = s + Math.floor(Math.random() * (e - s + 1));
  return new Date(t);
}
