import { login } from './login.cy';
import { generarPartidosRoundRobin } from './generarPartidosRoundRobin.cy';

export const inscribirACampeonato = (email, password, nombre) => {
  login(email, password);
  cy.get('a').contains('Campeonatos').first().click();

  cy.intercept('POST', '/api/federado-campeonato/*/*').as('inscribirACampeonato');
  cy.contains('h1', nombre)
    .first()
    .parent('div')
    .parent('div.bg-white')
    .find('button')
    .contains('Inscribirme')
    .click()
  cy.wait('@inscribirACampeonato').its('response.statusCode').should('eq', 200);
  cy.wait(500);

  generarPartidosRoundRobin('', '', nombre, true);
};