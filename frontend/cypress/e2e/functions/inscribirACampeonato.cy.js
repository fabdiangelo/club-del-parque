import { login } from './login.cy';
import { generarPartidosRoundRobin } from './generarPartidosRoundRobin.cy';

export const inscribirACampeonato = (email, password, nombre) => {
  login(email, password);
  cy.get('a', { timeout: 20000 }).contains('Campeonatos').first().click();

  cy.intercept('POST', '/api/federado-campeonato/*/*').as('inscribirACampeonato');
  cy.contains('h1', nombre, { timeout: 20000 })
    .first()
    .parent('div')
    .parent('div.bg-white')
    .find('button')
    .contains('Inscribirme')
    .click({ force: true });
  cy.wait('@inscribirACampeonato', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  cy.wait(500);

  generarPartidosRoundRobin('', '', nombre, true);
};