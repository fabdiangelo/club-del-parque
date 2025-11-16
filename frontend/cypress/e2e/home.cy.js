describe('Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('CYPRESS_URL'));
  });

  it('should display basic stuff', () => {
    cy.contains('Club del Parque').should('be.visible');
    cy.contains('Ver Campeonatos').should('be.visible');
    cy.contains('Instalaciones').should('be.visible');
    cy.contains('Noticias').should('be.visible');
    cy.contains('Ver más noticias').should('be.visible');
    cy.contains('Envíanos tu reporte').should('be.visible');
  });

  it('redirect correctly', () => {
    cy.get('a.btn').contains('Ver Campeonatos').click();
    cy.url().should('include', '/campeonatos');

    cy.get('img[alt="Club del Parque"]').click();
    cy.url().should('include', '/');
    cy.get('a.btn').contains('Ver más noticias').click();
    cy.url().should('include', '/noticias');

    cy.get('img[alt="Club del Parque"]').first().click();
    cy.url().should('include', '/');
    cy.get('a.btn').contains('Envíanos tu reporte').click();
    cy.url().should('include', '/reportes');

  });
});