import { login } from './functions/login.cy';

import { inscribirACampeonato } from './functions/inscribirACampeonato.cy';
import { generarPartidosRoundRobin } from './functions/generarPartidosRoundRobin.cy';
import { resolverPartidos } from './functions/resolverPartidos.cy';
import { generarPartidosEliminacion } from './functions/generarPartidosEliminacion.cy';

describe('Dashboard Tests', () => {
  // const nombre = `test_${Date.now()}`;
  const nombre = `test_dobles_masc`;

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
    // inscribirACampeonato('17@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('18@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('19@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('20@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('21@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('22@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('23@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('24@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('25@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('26@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('27@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('28@fed.com', 'Q1w2e3r4!', nombre);
    // inscribirACampeonato('29@fed.com', 'Q1w2e3r4!', nombre);
    inscribirACampeonato('30@fed.com', 'Q1w2e3r4!', nombre);
    inscribirACampeonato('31@fed.com', 'Q1w2e3r4!', nombre);
    inscribirACampeonato('32@fed.com', 'Q1w2e3r4!', nombre);
  });
  
  it('should let resolve matches', () => {
    generarPartidosRoundRobin('17@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('18@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('19@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('20@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('21@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('22@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('23@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('24@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('25@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('26@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('27@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('28@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('29@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('30@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('31@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosRoundRobin('32@fed.com', 'Q1w2e3r4!', nombre);
});

  it('should let resolve matches', () => {
    resolverPartidos('17@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('18@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('19@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('20@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('21@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('22@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('23@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('24@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('25@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('26@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('27@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('28@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('29@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('30@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('31@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('32@fed.com', 'Q1w2e3r4!', nombre);
});

  it('should let end championship', () => {
    generarPartidosEliminacion('17@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('19@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('25@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('27@fed.com', 'Q1w2e3r4!', nombre);
    
    resolverPartidos('17@fed.com', 'Q1w2e3r4!');
    resolverPartidos('19@fed.com', 'Q1w2e3r4!');
    resolverPartidos('25@fed.com', 'Q1w2e3r4!');
    resolverPartidos('27@fed.com', 'Q1w2e3r4!');

    generarPartidosEliminacion('17@fed.com', 'Q1w2e3r4!', nombre);
    generarPartidosEliminacion('25@fed.com', 'Q1w2e3r4!', nombre);
    resolverPartidos('17@fed.com', 'Q1w2e3r4!');
    resolverPartidos('25@fed.com', 'Q1w2e3r4!');
  });
});