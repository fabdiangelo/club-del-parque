// usecases/Usuarios/PrecargaFederados.js
import DBConnection from "../../infraestructure/ports/DBConnection.js";
import AuthConnection from "../../infraestructure/ports/AuthConnection.js";
import Registrado from "../../domain/entities/Registrado.js";
import Federado from "../../domain/entities/Federado.js";
import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";

// Lista de nombres y apellidos realistas (32)
const maleNames = [
  "Mateo", "Lucas", "Matías", "Diego", "Joaquín", "Samuel", "Emiliano", "Thiago",
  "Federico", "Nicolás", "Bruno", "Santiago", "Facundo", "Agustín", "Martín", "Tomás"
];

const femaleNames = [
  "Sofía", "Valentina", "Isabella", "Camila", "María", "Victoria", "Antonella", "Lucía",
  "Martina", "Amanda", "Gabriela", "Julia", "Florencia", "Agustina", "Carolina", "Paula"
];

const apellidos = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Martínez", "Sánchez", "Pérez",
  "Romero", "Torres", "Ruiz", "Flores", "Vega", "Rossi", "Alvarez", "Silva",
  "Morales", "Herrera", "Molina", "Ortiz", "Ibarra", "Costa", "Díaz", "Navarro",
  "García", "Cáceres", "Benítez", "Ramos", "Luna", "Suárez", "Córdoba", "Medina"
];

class PrecargaFederados {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
    this.password = "Q1w2e3r4!";
  }

  async execute() {
    try {
      for (let i = 1; i <= 32; i++) {
        const email = `${i}@fed.com`;

        // Del 1 al 16: mujeres, del 17 al 32: hombres
        const isMale = i > 16;
        const nombre = isMale
          ? maleNames[(i - 17) % maleNames.length]
          : femaleNames[(i - 1) % femaleNames.length];
        const apellido = apellidos[(i - 1) % apellidos.length];
        const genero = isMale ? "Masculino" : "Femenino";
        const nacimiento = randomDate(
          new Date(1980, 0, 1),
          new Date(2015, 11, 31)
        ).toISOString();

        // Auth user
        let userRecord;
        try {
          userRecord = await this.auth.createUser({
            email,
            password: this.password,
            displayName: `${nombre} ${apellido}`,
          });
          console.log(`Auth creado para ${email} -> uid ${userRecord.uid}`);
        } catch (err) {
          if (
            err.code === "auth/email-already-exists" ||
            err.message?.includes("already exists")
          ) {
            userRecord = await this.auth.getUserByEmail(email);
            console.log(`Auth ya existente para ${email} -> uid ${userRecord.uid}`);
          } else {
            console.error(`Error creando auth para ${email}:`, err);
            throw err;
          }
        }

        // claims
        try {
          await this.auth.setRole(userRecord.uid, "federado");
        } catch (err) {
          console.error(`Error asignando rol a ${userRecord.uid}:`, err);
          throw err;
        }

        // A) usuario -> en colección "usuarios"
        const existsUsuario = await this.db.getItem("usuarios", userRecord.uid);
        if (!existsUsuario) {
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
          console.log(`Usuario creado en "usuarios" para ${email}`);
        } else {
          await this.db.updateItem("usuarios", userRecord.uid, {
            genero,
            nacimiento,
          });
          console.log(`Usuario ya existe en "usuarios" para ${email}`);
        }

        // B) federado -> en colección "federados"
        const hoy = new Date();
        const existsFed = await this.federadoRepository.getFederadoById(
          userRecord.uid
        );
        if (!existsFed) {
          const federado = new Federado(
            userRecord.uid,
            email,
            nombre,
            apellido,
            "activo",
            nacimiento,
            genero,
            null // categoriaId
          );
          await this.federadoRepository.save(federado.toPlainObject());
          await this.federadoRepository.update(federado.id, {
            ...federado.toPlainObject(),
            estado: "activo",
            validoHasta: new Date(hoy.setMonth(hoy.getMonth() + 1)).toISOString(),
          });
          console.log(`Federado creado para ${email}`);
        } else {
          console.log(`Federado ya existe para ${email}`);
          await this.federadoRepository.update(existsFed.id, {
            ...existsFed,
            estado: "activo",
            rol: existsFed.rol || "federado",
            validoHasta: new Date(hoy.setMonth(hoy.getMonth() + 6)).toISOString(),
          });
        }
      }
    } catch (err) {
      console.error("Error en precarga de federados:", err);
      throw err;
    }
  }
}

export default new PrecargaFederados();

function randomDate(start, end) {
  const s = start.getTime();
  const e = end.getTime();
  const t = s + Math.floor(Math.random() * (e - s + 1));
  return new Date(t);
}
