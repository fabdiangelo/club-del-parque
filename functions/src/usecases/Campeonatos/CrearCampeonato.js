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

  // Interpret input count: the code historically used `cantidadJugadores`.
  // If payload provides `cantidadParticipantes`, prefer it (keeps compatibility).
  const inputCantidad = typeof payload.cantidadParticipantes !== 'undefined' ? payload.cantidadParticipantes : payload.cantidadJugadores;
  // If campeonato is dobles, the provided number represents teams; store total individuals in the Campeonato entity (teams * 2)
  const totalJugadores = dobles ? Number(inputCantidad) * 2 : Number(inputCantidad);
  const deporte = esTenis? "Tenis": "Padel"
  const puntosPorPosicion = 10;
  const c = new Campeonato(id, payload.nombre, payload.descripcion || '', payload.inicio, payload.fin || null, payload.ultimaPosicionJugable || 1, totalJugadores, requisitos, dobles, esTenis,  payload.temporadaID,deporte,puntosPorPosicion);

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

            let participantes = typeof payload.cantidadParticipantes !== 'undefined' ? payload.cantidadParticipantes : payload.cantidadJugadores;
            cantidadDeJugadoresIni = Number(participantes) || 0;
          }else{
            const inicioDate = new Date(etapasPayload[i - 1].fechaFin);
            if (!isNaN(inicioDate.getTime())) {
              const finDate = new Date(inicioDate);
              finDate.setDate(finDate.getDate() + Number(et.duracionDias));
              fechaFin = finDate.toISOString();
            }

            let prevFin = etapasPayload[i - 1].cantidadDeJugadoresFin;
            cantidadDeJugadoresIni = typeof prevFin !== 'undefined' ? Number(prevFin) : 0;
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
        // Generar grupos vacíos. Pasar flag de dobles para crear equipos de 2 cuando corresponda.
        const cantidadInicial = Number(et.cantidadDeJugadoresIni) || 0;
        const cantidadFinal = Number(et.cantidadDeJugadoresFin) || 0;
        const cantidadGrupos = et.cantGrupos || this.calcularCantidadGrupos(cantidadInicial, cantidadFinal);
        estructuraEtapa.grupos = this.generarGruposVacios(
          cantidadInicial,
          cantidadGrupos,
          c.dobles
        );
      } else if (et.tipoEtapa === 'eliminacion') {
        // Generar rondas vacías
        // For elimination we also need to indicate whether we're using teams (dobles).
        estructuraEtapa.rondas = this.generarRondasVacias(
          et.cantidadDeJugadoresIni,
          et.cantidadDeJugadoresFin,
          c.dobles
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
        et.duracionDias,
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
                temporadaID: c.temporadaID || null,
                canchaID: null,
                etapa: etapaId,
                jugadores: [],
                // For singles keep legacy slots empty; for doubles store team arrays under jugador1/jugador2
                jugador1: [],
                jugador2: [],
                resultado: null,
                // metadatos del partido para enlazar con la etapa
                meta: {
                  grupoID: grupo.id,
                  jugador1Index: partido.jugador1Index,
                  jugador2Index: partido.jugador2Index
                }
              };

              // If championship uses doubles, partido should reference team slots and not single player ids
              if (c.dobles) {
                partidoObj.tipoPartido = 'grupo-dobles';
                // store team slot indexes in meta
                partidoObj.meta.team1Index = partido.jugador1Index;
                partidoObj.meta.team2Index = partido.jugador2Index;
                // jugadores array will be empty until teams fill; use jugador1/jugador2 to carry player arrays when known
              }

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
                temporadaID: c.temporadaID || null,
                canchaID: null,
                etapa: etapaId,
                jugadores: [],
                jugador1: [],
                jugador2: [],
                resultado: null,
                meta: {
                  rondaID: ronda.id,
                  numeroPartido: partido.numeroPartido,
                  jugador1Origen: partido.jugador1Origen,
                  jugador2Origen: partido.jugador2Origen
                }
              };

              if (c.dobles) {
                partidoObj.tipoPartido = 'eliminacion-dobles';
                // Keep meta references to team origins and leave jugadores empty until teams are assigned
                partidoObj.meta.team1Origen = partido.jugador1Origen;
                partidoObj.meta.team2Origen = partido.jugador2Origen;
              }

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
  generarGruposVacios(cantidadJugadores, cantidadGrupos, dobles = false) {
    return this._generarGruposVaciosImpl(cantidadJugadores, cantidadGrupos, dobles);
  }

  // Internal implementation supporting dobles flag
  _generarGruposVaciosImpl(cantidadJugadores, cantidadGrupos, dobles) {
    const grupos = [];
    const slotsPorGrupo = Math.ceil(cantidadJugadores / cantidadGrupos);
    const nombresGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let i = 0; i < cantidadGrupos; i++) {
      const grupo = {
        id: `grupo-${nombresGrupos[i] || (i + 1)}`,
        nombre: `GRUPO ${nombresGrupos[i] || (i + 1)}`,
        jugadores: [],
        partidos: []
      };

      // Crear slots vacíos para equipos (dobles) o jugadores (singles)
      for (let j = 0; j < slotsPorGrupo; j++) {
        if (dobles) {
          grupo.jugadores.push({
            id: `equipo-${i}-${j}`,
            players: [
              { id: null, nombre: null },
              { id: null, nombre: null }
            ],
            posicion: j + 1,
            ganados: 0,
            perdidos: 0,
            puntos: 0,
            setsGanados: 0,
            setsPerdidos: 0,
            juegosGanados: 0,
            juegosPerdidos: 0
          });
        } else {
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
      }

      // Generar partidos vacíos (todos contra todos) entre slots (equipos o jugadores)
      for (let j = 0; j < slotsPorGrupo; j++) {
        for (let k = j + 1; k < slotsPorGrupo; k++) {
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
  generarRondasVacias(cantidadJugadoresIni, cantidadJugadoresFin, dobles = false) {
    // default dobles = false for backward compatibility
    return this._generarRondasVaciasImpl(cantidadJugadoresIni, cantidadJugadoresFin, dobles);
  }

  _generarRondasVaciasImpl(cantidadJugadoresIni, cantidadJugadoresFin, dobles) {
    const rondas = [];
    let jugadoresActuales = Number(cantidadJugadoresIni);
    let indiceRonda = 0;

    while (jugadoresActuales > Number(cantidadJugadoresFin)) {
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
          // For dobles we keep origen references the same; actual storage will reference team slots
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
