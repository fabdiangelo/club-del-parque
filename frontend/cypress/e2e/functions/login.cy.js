export const login = (email, password) => {
  cy.wait(500);
  cy.visit(Cypress.env('CYPRESS_URL') + '/login');
  cy.url().should('include', '/login');

  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);

  cy.intercept('POST', '/api/auth/login').as('login');
  cy.get('button[type="submit"]').click();
  cy.wait('@login').its('response.statusCode').should('eq', 200);

  cy.wait(800);
  cy.url().should('eq', Cypress.env('CYPRESS_URL') + '/');
};

