export const login = (email, password) => {
  cy.wait(500);
  cy.visit(Cypress.env('CYPRESS_URL') + '/login', { retryOnNetworkFailure: true });
  cy.url({ timeout: 20000 }).should('include', '/login');

  cy.get('input[type="email"]', { timeout: 20000 }).type(email);
  cy.get('input[type="password"]', { timeout: 20000 }).type(password);

  cy.intercept('POST', '/api/auth/login').as('login');
  cy.get('button[type="submit"]').click();
  cy.wait('@login', { timeout: 20000, requestTimeout: 20000 }).its('response.statusCode').should('eq', 200);

  cy.wait(800);
  cy.url({ timeout: 20000 }).should('eq', Cypress.env('CYPRESS_URL') + '/');
};

