import { login } from '../functions/login.cy';

export const resolverPartidos = (email = '', contraseña = '') => {

  if(email && contraseña) {
    login(email, contraseña);
  }

  cy.intercept('GET', '/api/partidos/jugador/*').as('getPartidos');
  cy.contains('a', 'Resultados').first().click();
  cy.url().should('include', '/resultados');
  cy.wait('@getPartidos');
  cy.wait(5000);

  function procesar(i) {
    cy.document().then(doc => {
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
      cy.wrap(links[i]).click();
      cy.wait('@getPartido');
      cy.url().should('include', '/partidos/');
      cy.wait(5000);

      cy.get('body').then($body => {
        const existeProponer = $body.text().includes('Proponer resultado');
        const existeAceptar = $body.text().includes('Aceptar propuesta');

        if (existeProponer) {
          cy.intercept('PUT', '/api/partidos/*').as('enviarResultado');
          cy.contains('button', 'Proponer resultado').click();
          cy.wait('@enviarResultado').its('response.statusCode').should('eq', 200);

          cy.go('back');
          cy.url().should('include', '/resultados');
          cy.wait('@getPartidos');
          cy.wait(5000);
          procesar(i + 1);

        } else if (existeAceptar) {
          cy.intercept('POST', '/api/partidos/*/ganadores').as('confirmarResultado');
          cy.contains('button', 'Aceptar propuesta').click();
          cy.wait('@confirmarResultado').its('response.statusCode').should('eq', 200);

          cy.go('back');
          cy.url().should('include', '/resultados');
          cy.wait('@getPartidos');
          cy.wait(5000);
          procesar(i);
        } else {
          cy.go('back');
          cy.url().should('include', '/resultados');
          cy.wait('@getPartidos');
          cy.wait(5000);
          procesar(i + 1);
        }
      });
    });
  }

  procesar(0);
};
