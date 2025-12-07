
import Usuario from "../../domain/entities/Usuario.js";
import Federado from "../../domain/entities/Federado.js";
import Subscripcion from "../../domain/entities/Subscripcion.js";
import { UsuarioRepository } from "../../infraestructure/adapters/UsuarioRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { PlanRepository } from "../../infraestructure/adapters/PlanRepository.js";
import { SubscripcionRepository } from "../../infraestructure/adapters/SubscripcionRepository.js";
import DBConnection from "../../infraestructure/ports/DBConnection.js";
import AuthConnection from "../../infraestructure/ports/AuthConnection.js";

class FederarUsuario {
  constructor(){
    this.usuarioRepository = new UsuarioRepository();
    this.federadoRepository = new FederadoRepository();
    this.planRepository = new PlanRepository();
    this.subscripcionRepository = new SubscripcionRepository();
    this.db = new DBConnection();
    this.auth = new AuthConnection();
  }

  async execute(usuario, planId) {
    try {
      if (!usuario) {
        throw new Error("Usuario inválido");
      }
      let fechaInicio = new Date();
      let federado = null;
      // 1. Obtener usuario y federado
      federado = await this.federadoRepository.getFederadoById(usuario.id);
      if (!federado) {
        federado = new Federado(
          usuario.id,
          usuario.email,
          usuario.nombre,
          usuario.apellido,
          "activo",
          usuario.nacimiento,
          usuario.genero,
          null // categoriaId
        );
        await this.federadoRepository.save(federado.toPlainObject());
      }

      // 2. Actualizar rol en Auth
      try {
        await this.auth.setRole(usuario.id, "federado");
      } catch (err) {
        console.error(`Error asignando rol federado en Auth a ${usuario.id}:`, err);
        // No lanzar, solo loguear
      }

      // 3. Actualizar/crear en colección usuarios
      const existsUsuario = await this.db.getItem("usuarios", usuario.id);
      if (!existsUsuario) {
        // Si no existe, crear como federado
        await this.db.putItem("usuarios", {
          ...usuario,
          rol: "federado",
          estado: "activo"
        }, usuario.id);
      } else {
        await this.db.updateItem("usuarios", usuario.id, {
          rol: "federado",
          estado: "activo",
          genero: usuario.genero,
          nacimiento: usuario.nacimiento
        });
      }

      // 4. Calcular fecha de inicio de suscripción
      if (federado.subscripcionesIDs && federado.subscripcionesIDs.length > 0) {
        const ultSub = await this.subscripcionRepository.getItem(federado.subscripcionesIDs[0]);
        if (ultSub && new Date(ultSub.fechaFin) > new Date()) {
          fechaInicio = new Date(ultSub.fechaFin);
        }
      }

      // 5. Crear suscripción
      const plan = await this.planRepository.findById(planId);
      if (!plan) {
        throw new Error("Plan no encontrado");
      }
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + plan.frecuenciaRenovacion);
      const nuevaSubscripcion = new Subscripcion(
        new Date().toISOString() + '-' + usuario.id + '-' + plan.id,
        fechaInicio.toISOString(),
        fechaFin.toISOString(),
        usuario.id,
        plan.id
      );
      const subId = await this.subscripcionRepository.save(nuevaSubscripcion.toPlainObject());

      // 6. Actualizar federado
      let nuevasSubs = federado.subscripcionesIDs && federado.subscripcionesIDs.length > 0
        ? [subId, ...federado.subscripcionesIDs]
        : [subId];
      await this.federadoRepository.update(federado.id, {
        ...federado,
        subscripcionesIDs: nuevasSubs,
        estado: "activo",
        validoHasta: nuevaSubscripcion.fechaFin,
        rol: "federado"
      });

    } catch (err) {
      console.error("Error federando usuario:", err);
      throw err;
    }
  }
}

export default new FederarUsuario();