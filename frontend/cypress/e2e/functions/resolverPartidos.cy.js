import { login } from '../functions/login.cy';

export const resolverPartidos = (email = '', contraseña = '') => {

  if(email && contraseña) {
    login(email, contraseña);
  }

  cy.intercept('GET', '/api/partidos/jugador/*').as('getPartidos');
  cy.contains('a', 'Resultados', { timeout: 20000 }).first().click({ force: true });
  cy.url({ timeout: 20000 }).should('include', '/resultados');
  cy.wait('@getPartidos', { timeout: 20000 });
  cy.wait(16000);

  function procesar(i) {
    cy.document({ timeout: 20000 }).then(doc => {
      const links = doc.querySelectorAll('a[title="Ir al partido"]');

      if (links.length === 0) {
        cy.log("No hay más partidos. Finalizando resolverPartidos.");
        return;
      }

      if (i >= links.length) {
        cy.log("Procesados todos los partidos.");
        return;
      }

      cy.log(`Procesando índice: ${i}`);

      cy.intercept('GET', '/api/partidos/*').as('getPartido');
      cy.wrap(links[i], { timeout: 20000 }).click({ force: true });
      cy.wait('@getPartido', { timeout: 20000 });
      cy.url({ timeout: 20000 }).should('include', '/partidos/');
      cy.wait(19000);

      cy.get('body', { timeout: 30000 }).then($body => {
        const existeProponer = $body.text().includes('Proponer resultado');
        const existeAceptar = $body.text().includes('Aceptar propuesta');

        if (existeProponer) {
          cy.intercept('PUT', '/api/partidos/*').as('enviarResultado');
          cy.contains('button', 'Proponer resultado', { timeout: 20000 }).click({ force: true });
          cy.wait('@enviarResultado', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

          cy.go('back');
          cy.url({ timeout: 20000 }).should('include', '/resultados');
          cy.wait('@getPartidos', { timeout: 20000 });
          cy.wait(10000);
          procesar(i + 1);

        } else if (existeAceptar){
          cy.intercept('POST', '/api/partidos/*/ganadores').as('confirmarResultado');
          cy.contains('Aceptar propuesta', { timeout: 20000 }).click({ force: true });
          cy.wait('@confirmarResultado', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

          cy.go('back');
          cy.url({ timeout: 20000 }).should('include', '/resultados');
          cy.wait('@getPartidos', { timeout: 20000 });
          cy.wait(10000);
          procesar(i);
        } else {
          cy.go('back');
          cy.url({ timeout: 20000 }).should('include', '/resultados');
          cy.wait('@getPartidos', { timeout: 20000 });
          cy.wait(10000);
          procesar(i + 1);
        }
      });
    });
  }

  procesar(0);
};
