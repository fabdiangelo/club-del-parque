import { login } from './functions/login.cy';

import { inscribirACampeonato } from './functions/inscribirACampeonato.cy';
import { generarPartidosRoundRobin } from './functions/generarPartidosRoundRobin.cy';
import { resolverPartidos } from './functions/resolverPartidos.cy';
import { generarPartidosEliminacion } from './functions/generarPartidosEliminacion.cy';

describe('Dashboard Tests', () => {
  // const nombre = `test_${Date.now()}`;
  const nombre = `camp_padel_dobles_fem_2`;

  // it('should create campeonato', () => {
  //   login(Cypress.env('CYPRESS_ADMIN_EMAIL'), Cypress.env('CYPRESS_ADMIN_PASSWORD'));
  //   cy.visit(Cypress.env('CYPRESS_URL') + '/crear-campeonato');

  //   cy.get('input[name="nombre"]').type(nombre);
  //   cy.get('textarea[name="descripcion"]').type('Descripcion del campeonato');
  //   cy.get('select[name="req.genero"]').select('Femenino');
  //   cy.get('select[name="formatoCampeonatoID"]').select('completo-8');
  //   cy.get('input[name="inicio"]').type('2026-01-01');
  //   cy.get('input[placeholder="Cant. grupos"]').type('2');
  //   cy.get('input[placeholder="Jugadores al finalizar').first().type('4');
  //   cy.get('input[placeholder="Duración (días)').first().type('14');
  //   cy.get('input[placeholder="Jugadores al finalizar').eq(1).type('1');
  //   cy.get('input[placeholder="Duración (días)').eq(1).type('14');
  //   cy.get('select[name="temporadaID"] option').filter((i, el) => el.value).first().then(option => {
  //     cy.get('select[name="temporadaID"]').select(option.val())
  //   })
  //   cy.wait(500);

  //   cy.intercept('POST', '/api/campeonatos').as('crearCampeonato');
  //   cy.get('button[type="submit"]').click();
  //   cy.wait('@crearCampeonato').its('response.statusCode').should('eq', 200);
  //   cy.wait(1000);
  // });

  it('should let inscribe all federated users', () => {
    // inscribirACampeonato('1@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('2@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('3@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('4@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('5@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('6@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('7@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('8@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('9@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('10@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('11@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('12@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('13@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('14@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('15@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('16@fed.com', 'Q1w2e3r4!', nombre);
  });
  
  it('should let reservar matches', () => {
    // generarPartidosRoundRobin('1@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('2@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('3@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('4@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('5@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('6@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('7@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('8@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('9@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('10@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('11@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('12@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('13@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('14@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('15@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosRoundRobin('16@fed.com', 'Q1w2e3r4!', nombre);
  });
  
  it('should let resolve matches', () => {
    // resolverPartidos('1@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('2@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('3@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('4@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('5@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('6@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('7@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('8@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('9@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('10@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('11@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('12@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('13@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('14@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('15@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('16@fed.com', 'Q1w2e3r4!', nombre);
});

  it('should let end championship', () => {
    generarPartidosEliminacion('1@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('2@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('5@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('6@fed.com', 'Q1w2e3r4!', nombre);
    
    resolverPartidos('1@fed.com', 'Q1w2e3r4!');
    resolverPartidos('2@fed.com', 'Q1w2e3r4!');
    resolverPartidos('5@fed.com', 'Q1w2e3r4!');
    resolverPartidos('6@fed.com', 'Q1w2e3r4!');

    // generarPartidosEliminacion('1@fed.com', 'Q1w2e3r4!', nombre);
    // generarPartidosEliminacion('5@fed.com', 'Q1w2e3r4!', nombre);
    // resolverPartidos('1@fed.com', 'Q1w2e3r4!');
    // resolverPartidos('5@fed.com', 'Q1w2e3r4!');
  });
});