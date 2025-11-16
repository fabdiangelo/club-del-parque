import { login } from './functions/login.cy';

describe('Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('CYPRESS_URL') + '/reportes');
    // login(Cypress.env('CYPRESS_ADMIN_EMAIL'), Cypress.env('CYPRESS_ADMIN_PASSWORD'));
  });

  it('should send reports', () => {
    cy.contains('SISTEMA DE REPORTES').should('be.visible');
    cy.get('input[placeholder="Motivo"]').type('motivo ej');
    cy.get('textarea[placeholder="Descripción"]').type('Descrip ejemplo');
    cy.get('button[type="submit"]').click();
  });

  it('should view and respond reports', () => {
    login(Cypress.env('CYPRESS_ADMIN_EMAIL'), Cypress.env('CYPRESS_ADMIN_PASSWORD'));
    cy.visit(Cypress.env('CYPRESS_URL') + '/administracion');
    cy.get('button').contains('Tickets').click();
    cy.get('span').contains('reporte_bug').should('be.visible');
    cy.get('p').contains('motivo ej').should('be.visible');
    cy.contains('td', 'motivo ej')
      .first()
      .parent('tr')
      .find('button')
      .click()
    cy.contains('anónimo').should('be.visible');
    cy.get('p').contains('Descrip ejemplo').should('be.visible');

    cy.intercept('PUT', '/api/reportes/marcar-resuelto/*').as('resolverReporte');
    cy.get('button').contains('Marcar como resuelto').click();
    cy.wait('@resolverReporte').its('response.statusCode').should('eq', 200);

    cy.get('button').contains('VER TODOS LOS TICKETS').click();
    cy.intercept('GET', '/api/reportes').as('verTodosReportes');

    cy.url().should('include', '/administracion/reportes');
    cy.wait('@verTodosReportes').its('response.statusCode').should('eq', 200);
    
    cy.get('p').contains('motivo ej').should('be.visible');
    cy.contains('Resuelto').should('be.visible');

  });
});