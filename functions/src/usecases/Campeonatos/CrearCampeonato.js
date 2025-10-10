import Campeonato from "../../domain/entities/Campeonato.js";
import Etapa from "../../domain/entities/Etapa.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";

class CrearCampeonato {
  constructor() {
    this.campeonatoRepository = new CampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
  }

  async execute(payload) {
    // Validar campos obligatorios
    if (!payload || !payload.nombre || !payload.inicio || !payload.etapas || !payload.cantidadJugadores) throw new Error('Faltan campos requerido');
    
    const id = payload.id || `${payload.nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${Date.now()}`;
    const requisitos = payload.requisitosParticipacion || { genero: 'ambos', edadDesde: null, edadHasta: null, rankingDesde: null, rankingHasta: null };
    const dobles = typeof payload.dobles !== 'undefined' ? payload.dobles : false;
    const esTenis = typeof payload.esTenis !== 'undefined' ? payload.esTenis : true;

    const c = new Campeonato(id, payload.nombre, payload.descripcion || '', payload.inicio, payload.fin || null, payload.ultimaPosicionJugable || 1, payload.cantidadJugadores, requisitos, dobles, esTenis);

    // If payload.etapas is provided, validate and persist each etapa, attaching their IDs to campeonato
    const etapasPayload = Array.isArray(payload.etapas) ? payload.etapas : [];
    for (let i = 0; i < etapasPayload.length; i++) {
      const et = etapasPayload[i];
      if (typeof et.cantidadDeJugadoresFin === 'undefined' || et.cantidadDeJugadoresFin === null) throw new Error(`Etapa[${i}]: cantidadDeJugadoresFin es requerida`);
      if (typeof et.duracionDias === 'undefined' || et.duracionDias === null) throw new Error(`Etapa[${i}]: duracionDias es requerida`);

      const etapaId = `${c.id}-etapa-${i+1}-${et.nombre}-${Date.now()}`;

      let fechaFin = null;
      let cantidadDeJugadoresIni = 0;
      if (c.inicio) {
        try {
          if(i == 0){
            const inicioDate = new Date(c.inicio);
            if (!isNaN(inicioDate.getTime())) {
              const finDate = new Date(inicioDate);
              finDate.setDate(finDate.getDate() + Number(et.duracionDias));
              fechaFin = finDate.toISOString();
            }

            cantidadDeJugadoresIni = payload.cantidadParticipantes;
          }else{
            const inicioDate = new Date(etapasPayload[i - 1].fechaFin);
            if (!isNaN(inicioDate.getTime())) {
              const finDate = new Date(inicioDate);
              finDate.setDate(finDate.getDate() + Number(et.duracionDias));
              fechaFin = finDate.toISOString();
            }

            cantidadDeJugadoresIni = etapasPayload[i - 1].cantidadDeJugadoresFin;
          }
        } catch (e) {
          fechaFin = null;
        }
      }
      et.fechaFin = fechaFin;
      et.cantidadDeJugadoresIni = cantidadDeJugadoresIni;


      const etapa = new Etapa(etapaId, et.nombre || `Etapa ${i+1}`, c.id, et.tipoEtapa, et.cantidadSets, et.juegosPorSet, et.permitirEmpate, et.cantidadDeJugadoresIni || null, et.cantidadDeJugadoresFin, fechaFin);
      await this.etapaRepository.save(etapa.toPlainObject());
      c.etapasIDs.push(etapaId);

      if (etapa.fechaFin) {
        c.fin = etapa.fechaFin;
      }
    }

    await this.campeonatoRepository.save(c.toPlainObject());
    return id;
  }
}

export default new CrearCampeonato();
