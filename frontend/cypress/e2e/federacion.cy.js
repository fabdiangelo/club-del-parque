import { login } from './functions/login.cy';

describe('Dashboard Tests', () => {
  it('should display basic stuff', () => {
    const email = `test_${Date.now()}@example.com`;

    cy.visit(Cypress.env('CYPRESS_URL') + '/register');
    
    cy.contains('Registro').should('be.visible');
    cy.get('input[name="nombre"]').type('Nombre');
    cy.get('input[name="apellido"]').type('Apellido');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('Q1w2e3r4!');
    cy.get('input[name="nacimiento"]').type('2000-01-01');
    cy.get('select[name="genero"]').select('Masculino');
    
    cy.intercept('POST', '/api/auth/register').as('registrarUsuario');
    cy.get('button[type="submit"]').click();
    cy.wait('@registrarUsuario').its('response.statusCode').should('eq', 201);

    cy.get('button').contains('Perfil').first().click();
    cy.contains(email).should('be.visible');
    cy.get('button').contains('Solicitar Federación').click();
    cy.contains('Solicitud de Federación').should('be.visible');
    cy.get('textarea#federateJustificante').type('Justificante de prueba');

    cy.intercept('POST', '/api/reporte/*/solicitud-federacion').as('solicitarFederacion');
    cy.get('button[type="submit"]').click();
    cy.wait('@solicitarFederacion').its('response.statusCode').should('eq', 200);
    
    cy.get('button').contains('Cerrar sesión').click();
    cy.url().should('include', '/login');

    login(Cypress.env('CYPRESS_ADMIN_EMAIL'), Cypress.env('CYPRESS_ADMIN_PASSWORD'));
    cy.visit(Cypress.env('CYPRESS_URL') + '/administracion');
    cy.get('button').contains('Tickets').click();
    cy.get('span').contains('solicitud_federacion').should('be.visible');
    cy.get('p').contains(email).should('be.visible');
    cy.contains('td', email)
      .first()
      .parent('tr')
      .find('button')
      .click()
    cy.contains('Justificante de prueba').should('be.visible');
    cy.get('select').first().select('Anual');


    cy.intercept('POST', '/api/usuarios/validar-federacion/*').as('procesarFederacion');
    cy.get('button').contains('Validar').click();
    cy.wait('@procesarFederacion').its('response.statusCode').should('eq', 200);
  });
});