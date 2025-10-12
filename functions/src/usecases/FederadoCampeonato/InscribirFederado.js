
import FederadoCampeonato from "../../domain/entities/FederadoCampeonato.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { FederadoRepository } from "../../infraestructure/adapters/FederadoRepository.js";
import { FederadoCampeonatoRepository } from "../../infraestructure/adapters/FederadoCampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";

class InscribirFederado {
  constructor() {
    this.campeonatoRepository = new CampeonatoRepository();
    this.federadoRepository = new FederadoRepository();
    this.federadoCampeonatoRepository = new FederadoCampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
    this.partidoRepository = new PartidoRepository();
  }

  /**
   * Inscribe un federado (uid) en un campeonato (campeonatoId).
   * Valida: licencia vigente (validoHasta > inicio), no duplicado y cupos disponibles.
   * Asocia al campeonato, crea el registro federado-campeonato y lo inserta en la primera etapa
   * (en roundRobin lo pone en un grupo/slot y actualiza los partidos correspondientes; en eliminación
   * lo asigna a los slots de la primera ronda de inscripción).
   */
  async execute(uid, campeonatoId) {
    if (!uid) throw new Error("Se requiere el uid del federado");
    if (!campeonatoId) throw new Error("Se requiere el id del campeonato");

    // Obtener datos
    const federado = await this.federadoRepository.getFederadoById(uid);
    if (!federado) throw new Error("Federado no encontrado");

    const campeonato = await this.campeonatoRepository.findById(campeonatoId);
    if (!campeonato) throw new Error("Campeonato no encontrado");

    // 1) Validar validoHasta > inicio
    if (!federado.validoHasta) throw new Error("Federado no tiene licencia válida");
    const validoHasta = new Date(federado.validoHasta);
    const inicio = new Date(campeonato.inicio);
    if (isNaN(validoHasta.getTime()) || isNaN(inicio.getTime())) {
      throw new Error("Formato de fecha inválido en federado o campeonato");
    }
    if (validoHasta.getTime() <= inicio.getTime()) {
      throw new Error("La licencia del federado vence antes del inicio del campeonato");
    }

    // 2) Verificar que no esté ya inscripto en el mismo campeonato
    // Buscar en la colección federado-campeonato por federadoID
    const existentes = await this.federadoCampeonatoRepository.db.getItemsByField(this.federadoCampeonatoRepository.collection, 'federadoID', uid);
    const yaInscripto = Array.isArray(existentes) ? existentes.find(x => x.campeonatoID === campeonatoId) : null;
    if (yaInscripto) throw new Error('El federado ya está inscripto en este campeonato');

    // Validar requisitosParticipacion (género, edad, ranking (comentado))
    const requisitos = campeonato.requisitosParticipacion || {};
    if (requisitos.genero && requisitos.genero !== 'ambos') {
      if (!federado.genero || federado.genero.toLowerCase() !== requisitos.genero.toLowerCase()) {
        throw new Error('El federado no cumple con el requisito de género');
      }
    }
    if (requisitos.edadDesde || requisitos.edadHasta) {
      if (!federado.nacimiento) throw new Error('No se puede validar edad del federado');
      const nacimiento = new Date(federado.nacimiento);
      if (isNaN(nacimiento.getTime())) throw new Error('Fecha de nacimiento inválida');
      const hoy = new Date(campeonato.inicio || Date.now());
      const edad = hoy.getFullYear() - nacimiento.getFullYear();
      if (requisitos.edadDesde && edad < requisitos.edadDesde) throw new Error('El federado no cumple con la edad mínima');
      if (requisitos.edadHasta && edad > requisitos.edadHasta) throw new Error('El federado no cumple con la edad máxima');
    }
    // Ranking validación pendiente - comentada por ahora
    // if (requisitos.rankingDesde || requisitos.rankingHasta) { ... }

    // 3) Verificar cupos disponibles en el campeonato
    const inscritos = Array.isArray(campeonato.federadosCampeonatoIDs) ? campeonato.federadosCampeonatoIDs.length : 0;
    if (inscritos >= campeonato.cantidadJugadores) throw new Error('No hay cupos disponibles en el campeonato');

    // 4) Crear registro federado-campeonato
    const fcId = `${campeonatoId}-federado-${uid}-${Date.now()}`;
    const federadoCampeonato = new FederadoCampeonato(fcId, 0, null, uid, campeonatoId);
    await this.federadoCampeonatoRepository.save(federadoCampeonato.toPlainObject());

    // 5) Actualizar campeonato → agregar referencia al federado-campeonato
    campeonato.federadosCampeonatoIDs = Array.isArray(campeonato.federadosCampeonatoIDs) ? campeonato.federadosCampeonatoIDs : [];
    campeonato.federadosCampeonatoIDs.push(fcId);
    await this.campeonatoRepository.update(campeonatoId, campeonato);

    // 6) Actualizar federado → agregar referencia al federado-campeonato
    federado.federadoCampeonatosIDs = Array.isArray(federado.federadoCampeonatosIDs) ? federado.federadoCampeonatosIDs : [];
    federado.federadoCampeonatosIDs.push(fcId);
    await this.federadoRepository.update(uid, federado);

    // 7) Asociar al la primera etapa
    if (!Array.isArray(campeonato.etapasIDs) || campeonato.etapasIDs.length === 0) {
      // No hay etapas definidas, devolvemos el id de la inscripción
      return fcId;
    }

    const primeraEtapaId = campeonato.etapasIDs[0];
    const etapa = await this.etapaRepository.findById(primeraEtapaId);
    if (!etapa) return fcId; // etapa no encontrada, ya quedó inscripto en campeonato

    // Round Robin: buscar primer slot vacío en grupos
    if (etapa.tipoEtapa === 'roundRobin' && Array.isArray(etapa.grupos)) {
      let colocado = false;
      for (let gi = 0; gi < etapa.grupos.length && !colocado; gi++) {
        const grupo = etapa.grupos[gi];
        if (!Array.isArray(grupo.jugadores)) continue;
        for (let si = 0; si < grupo.jugadores.length; si++) {
          const slot = grupo.jugadores[si];
          if (!slot.id) {
            // Asignar federado al slot
            slot.id = uid;
            slot.nombre = `${federado.nombre || ''} ${federado.apellido || ''}`.trim();
            // mantener posicion si existe, si no asignar
            if (!slot.posicion) slot.posicion = si + 1;

            // Actualizar partidos del grupo que referencian este índice
            if (Array.isArray(grupo.partidos)) {
              for (const partido of grupo.partidos) {
                if (typeof partido.jugador1Index !== 'undefined' && partido.jugador1Index === si) {
                  partido.jugador1Id = uid;
                  // actualizar partido persistido si existe
                  const partidoId = `${primeraEtapaId}-${grupo.id || 'grupo'}-${partido.id}`;
                  try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e){ /* no bloquear */ }
                }
                if (typeof partido.jugador2Index !== 'undefined' && partido.jugador2Index === si) {
                  partido.jugador2Id = uid;
                  const partidoId = `${primeraEtapaId}-${grupo.id || 'grupo'}-${partido.id}`;
                  try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e){ /* no bloquear */ }
                }
              }
            }

            colocado = true;
            break;
          }
        }
      }

      if (!colocado) {
        // No hubo slot en grupos (aunque cupo disponible en campeonato). Intentar poner al final del primer grupo
        if (etapa.grupos && etapa.grupos.length > 0) {
          const grupo = etapa.grupos[0];
          grupo.jugadores.push({
            id: uid,
            nombre: `${federado.nombre || ''} ${federado.apellido || ''}`.trim(),
            posicion: grupo.jugadores.length + 1,
            ganados: 0,
            perdidos: 0,
            puntos: 0,
            setsGanados: 0,
            setsPerdidos: 0,
            juegosGanados: 0,
            juegosPerdidos: 0
          });
          // No hay partidos que actualizar si se agregó al final (no existen partidos previos)
        }
      }
    } else if (etapa.tipoEtapa === 'eliminacion' && Array.isArray(etapa.rondas)) {
      // Eliminación: buscar la primera ronda y partido con origen 'inscripcion' y slot vacío
      let asignado = false;
      for (let ri = 0; ri < etapa.rondas.length && !asignado; ri++) {
        const ronda = etapa.rondas[ri];
        if (!Array.isArray(ronda.partidos)) continue;
        for (let pi = 0; pi < ronda.partidos.length && !asignado; pi++) {
          const partido = ronda.partidos[pi];
          // Solo asignar en la primera ronda de inscripciones (la creación estableció jugadorXOrigen === 'inscripcion' para la ronda 0)
          if (partido.jugador1Origen === 'inscripcion' && !partido.jugador1Id) {
            partido.jugador1Id = uid;
            const partidoId = `${primeraEtapaId}-${ronda.id || 'ronda'}-${partido.id}`;
            try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
            asignado = true;
            break;
          }
          if (partido.jugador2Origen === 'inscripcion' && !partido.jugador2Id) {
            partido.jugador2Id = uid;
            const partidoId = `${primeraEtapaId}-${ronda.id || 'ronda'}-${partido.id}`;
            try { await this.partidoRepository.update(partidoId, { ...partido }); } catch(e) { }
            asignado = true;
            break;
          }
        }
      }

      // Si no se asignó porque no había slots (raro si hay cupo en campeonato), dejar sin asignar en etapa
    }

    // Guardar etapa actualizada
    await this.etapaRepository.save({ id: etapa.id, ...etapa });

    return fcId;
  }
}

export default new InscribirFederado();