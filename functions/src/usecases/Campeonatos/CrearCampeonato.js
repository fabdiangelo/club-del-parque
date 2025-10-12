import Campeonato from "../../domain/entities/Campeonato.js";
import Etapa from "../../domain/entities/Etapa.js";
import { CampeonatoRepository } from "../../infraestructure/adapters/CampeonatoRepository.js";
import { EtapaRepository } from "../../infraestructure/adapters/EtapaRepository.js";
import { PartidoRepository } from "../../infraestructure/adapters/PartidoRepository.js";

class CrearCampeonato {
  constructor() {
    this.campeonatoRepository = new CampeonatoRepository();
    this.etapaRepository = new EtapaRepository();
    this.partidoRepository = new PartidoRepository();
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

      // Generar estructura según tipo de etapa
      let estructuraEtapa = {};
      
      if (et.tipoEtapa === 'roundRobin') {
        // Generar grupos vacíos
        estructuraEtapa.grupos = this.generarGruposVacios(
          et.cantidadDeJugadoresIni, 
          et.cantGrupos || this.calcularCantidadGrupos(et.cantidadDeJugadoresIni, et.cantidadDeJugadoresFin)
        );
      } else if (et.tipoEtapa === 'eliminacion') {
        // Generar rondas vacías
        estructuraEtapa.rondas = this.generarRondasVacias(
          et.cantidadDeJugadoresIni,
          et.cantidadDeJugadoresFin
        );
      }

      const etapa = new Etapa(
        etapaId, 
        et.nombre || `Etapa ${i+1}`, 
        c.id, 
        et.tipoEtapa, 
        et.cantidadSets, 
        et.juegosPorSet, 
        et.permitirEmpate, 
        et.cantidadDeJugadoresIni || null, 
        et.cantidadDeJugadoresFin, 
        fechaFin,
        estructuraEtapa.grupos || null,
        estructuraEtapa.rondas || null
      );
      
      // Persistir partidos generados en la estructura de la etapa
      // Para grupos (roundRobin)
      if (etapa.grupos && Array.isArray(etapa.grupos)) {
        for (const grupo of etapa.grupos) {
          if (Array.isArray(grupo.partidos)) {
            for (const partido of grupo.partidos) {
              // Crear objeto partido minimal para persistir
              const partidoObj = {
                id: `${etapaId}-${grupo.id || 'grupo'}-${partido.id}`,
                timestamp: new Date().toISOString(),
                estado: partido.estado || 'pendiente',
                tipoPartido: 'grupo',
                temporadaID: null,
                canchaID: null,
                etapa: etapaId,
                jugadores: [],
                equipoLocal: [],
                equipoVisitante: [],
                resultado: null,
                // metadatos del partido para enlazar con la etapa
                meta: {
                  grupoID: grupo.id,
                  jugador1Index: partido.jugador1Index,
                  jugador2Index: partido.jugador2Index
                }
              };
              try {
                await this.partidoRepository.save(partidoObj);
              } catch (e) {
                // Si falla la persistencia de partido, continuar sin bloquear la creación del campeonato
                console.warn('No se pudo persistir partido de grupo', partidoObj.id, e.message || e);
              }
            }
          }
        }
      }

      // Para rondas (eliminacion)
      if (etapa.rondas && Array.isArray(etapa.rondas)) {
        for (const ronda of etapa.rondas) {
          if (Array.isArray(ronda.partidos)) {
            for (const partido of ronda.partidos) {
              const partidoObj = {
                id: `${etapaId}-${ronda.id || 'ronda'}-${partido.id}`,
                timestamp: new Date().toISOString(),
                estado: partido.estado || 'pendiente',
                tipoPartido: 'eliminacion',
                temporadaID: null,
                canchaID: null,
                etapa: etapaId,
                jugadores: [],
                equipoLocal: [],
                equipoVisitante: [],
                resultado: null,
                meta: {
                  rondaID: ronda.id,
                  numeroPartido: partido.numeroPartido,
                  jugador1Origen: partido.jugador1Origen,
                  jugador2Origen: partido.jugador2Origen
                }
              };
              try {
                await this.partidoRepository.save(partidoObj);
              } catch (e) {
                console.warn('No se pudo persistir partido de eliminacion', partidoObj.id, e.message || e);
              }
            }
          }
        }
      }

      await this.etapaRepository.save(etapa.toPlainObject());
      c.etapasIDs.push(etapaId);

      if (etapa.fechaFin) {
        c.fin = etapa.fechaFin;
      }
    }

    await this.campeonatoRepository.save(c.toPlainObject());
    return id;
  }

  /**
   * Calcula la cantidad óptima de grupos basándose en jugadores iniciales y finales
   * Asumiendo que clasifican los 2 primeros de cada grupo
   */
  calcularCantidadGrupos(jugadoresIni, jugadoresFin) {
    // Si clasifican jugadoresFin jugadores y avanzan ~2 por grupo
    const gruposNecesarios = Math.ceil(jugadoresFin / 2);
    // Validar que tenga sentido dividir jugadoresIni en esa cantidad de grupos
    const jugadoresPorGrupo = Math.floor(jugadoresIni / gruposNecesarios);
    if (jugadoresPorGrupo < 3) {
      // Si quedan menos de 3 por grupo, reducir cantidad de grupos
      return Math.floor(jugadoresIni / 4); // Mínimo 4 jugadores por grupo
    }
    return gruposNecesarios;
  }

  /**
   * Genera la estructura de grupos vacía para fase Round Robin
   */
  generarGruposVacios(cantidadJugadores, cantidadGrupos) {
    const grupos = [];
    const jugadoresPorGrupo = Math.ceil(cantidadJugadores / cantidadGrupos);
    const nombresGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let i = 0; i < cantidadGrupos; i++) {
      const grupo = {
        id: `grupo-${nombresGrupos[i] || (i + 1)}`,
        nombre: `GRUPO ${nombresGrupos[i] || (i + 1)}`,
        jugadores: [],
        partidos: []
      };

      // Crear slots vacíos para jugadores
      for (let j = 0; j < jugadoresPorGrupo; j++) {
        grupo.jugadores.push({
          id: null, // Se llenará al inscribirse
          nombre: null,
          posicion: j + 1,
          ganados: 0,
          perdidos: 0,
          puntos: 0,
          setsGanados: 0,
          setsPerdidos: 0,
          juegosGanados: 0,
          juegosPerdidos: 0
        });
      }

      // Generar partidos vacíos (todos contra todos)
      for (let j = 0; j < jugadoresPorGrupo; j++) {
        for (let k = j + 1; k < jugadoresPorGrupo; k++) {
          grupo.partidos.push({
            id: `partido-${i}-${j}-${k}`,
            jugador1Index: j,
            jugador2Index: k,
            jugador1Id: null,
            jugador2Id: null,
            estado: 'pendiente', // pendiente, en_curso, finalizado
            resultado: null,
            sets: [],
            fechaProgramada: null,
            fechaJugado: null
          });
        }
      }

      grupos.push(grupo);
    }

    return grupos;
  }

  /**
   * Genera la estructura de rondas vacía para fase de Eliminación
   */
  generarRondasVacias(cantidadJugadoresIni, cantidadJugadoresFin) {
    const rondas = [];
    let jugadoresActuales = cantidadJugadoresIni;
    let indiceRonda = 0;

    // Calcular cantidad de rondas necesarias
    const cantidadRondas = Math.ceil(Math.log2(cantidadJugadoresIni));
    
    while (jugadoresActuales > cantidadJugadoresFin) {
      const cantidadPartidos = Math.floor(jugadoresActuales / 2);
      const nombreRonda = this.getNombreRonda(jugadoresActuales, cantidadJugadoresFin);
      
      const ronda = {
        id: `ronda-${indiceRonda}`,
        nombre: nombreRonda,
        indice: indiceRonda,
        cantidadPartidos: cantidadPartidos,
        jugadoresEnRonda: jugadoresActuales,
        partidos: []
      };

      // Crear partidos vacíos para esta ronda
      for (let i = 0; i < cantidadPartidos; i++) {
        ronda.partidos.push({
          id: `partido-r${indiceRonda}-${i}`,
          numeroPartido: i + 1,
          jugador1Id: null,
          jugador2Id: null,
          jugador1Origen: indiceRonda === 0 ? 'inscripcion' : `ganador-r${indiceRonda-1}-${i*2}`,
          jugador2Origen: indiceRonda === 0 ? 'inscripcion' : `ganador-r${indiceRonda-1}-${i*2+1}`,
          estado: 'pendiente',
          resultado: null,
          ganadorId: null,
          sets: [],
          fechaProgramada: null,
          fechaJugado: null
        });
      }

      rondas.push(ronda);
      jugadoresActuales = cantidadPartidos;
      indiceRonda++;
    }

    return rondas;
  }

  /**
   * Obtiene el nombre apropiado para una ronda según cantidad de jugadores
   */
  getNombreRonda(jugadoresEnRonda, jugadoresFin) {
    if (jugadoresEnRonda === 2) return 'FINAL';
    if (jugadoresEnRonda === 4) return 'SEMIFINALES';
    if (jugadoresEnRonda === 8) return 'CUARTOS DE FINAL';
    if (jugadoresEnRonda === 16) return 'OCTAVOS DE FINAL';
    if (jugadoresEnRonda === 32) return 'DIECISEISAVOS DE FINAL';
    return `RONDA DE ${jugadoresEnRonda}`;
  }
}

export default new CrearCampeonato();
