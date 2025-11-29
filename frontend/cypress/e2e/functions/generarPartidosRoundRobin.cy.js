import { login } from '../functions/login.cy';

export const generarPartidosRoundRobin = (email = '', contraseña = '', nombre, inCampeonatos = false) => {
  if(email && contraseña) {
    login(email, contraseña);
  }

  if(!inCampeonatos){
    cy.get('a', { timeout: 20000 }).contains('Campeonatos').first().click();
  }

  cy.url({ timeout: 20000 }).then((currentUrl) => {
    if (!currentUrl.endsWith('/campeonatos')) {
      cy.get('a', { timeout: 20000 }).contains('Campeonatos').first().click();
    }
  });
  cy.wait(1000);

  cy.intercept('GET', '/api/campeonato/*').as('getCampeonato');
  cy.contains('h1', nombre, { timeout: 20000 })
    .first()
    .parent('div')
    .parent('div.bg-white')
    .find('a')
    .contains('VER MÁS')
    .click({ force: true });
  cy.wait('@getCampeonato', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
  cy.wait(10000);

  cy.get('body', { timeout: 30000 }).then($body => {
    const botones = $body.find('button[title="Ir al partido"]');
    if (botones.length === 0) {
      cy.log('No hay botón confirmar, sigo con el test');
      return;
    }
    const total = botones.length;

    for (let i = 0; i < total; i++) {
      cy.intercept('GET', '/api/reservas').as('getReservas');
      cy.get('button[title="Ir al partido"]', { timeout: 30000 }).eq(i).click({ force: true });
      cy.url({ timeout: 30000 }).should('include', '/partido/');
      cy.wait('@getReservas', { timeout: 30000 });

      cy.wait(19000);
      cy.get('body', { timeout: 30000 }).then($body2 => {
        const existeGenerarPropuesta = $body2.text().includes('Generar Propuesta');
        const existeAceptarPropuesta = $body2.text().includes('Aceptar Propuesta');
        if (existeGenerarPropuesta) {
          cy.contains('button', 'Generar Propuesta', { timeout: 20000 }).click({ force: true });
          cy.get('div.grid button', { timeout: 20000 }).first().click({ force: true });
          cy.get('select', { timeout: 20000 }).eq(0).find('option').eq(1).then($opt => {
            cy.get('select', { timeout: 20000 }).eq(0).select($opt.val());
          });
          cy.get('select', { timeout: 20000 }).eq(1).find('option').eq(2).then($opt => {
            cy.get('select', { timeout: 20000 }).eq(1).select($opt.val());
          });
          cy.contains('button', 'Agregar', { timeout: 20000 }).click({ force: true });

          cy.intercept('POST', '/api/partidos/*/disponibilidad').as('enviarDisponibilidad');
          cy.contains('button', 'Enviar disponibilidad', { timeout: 20000 }).click({ force: true });
          cy.wait('@enviarDisponibilidad', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

          cy.go('back');
          cy.wait(2000);
        } else if (existeAceptarPropuesta) {
          cy.intercept('PUT', '/api/partidos/*/confirmar-horario').as('confirmarDisponibilidad');
          cy.contains('button', 'Aceptar Propuesta', { timeout: 20000 }).first().click({ force: true });
          cy.wait('@confirmarDisponibilidad', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
          cy.go('back');
          cy.wait(2000);
        }else{
          cy.log('No hay acciones para realizar en el partido');
          cy.go('back');
          cy.wait(2000);
        }
      });
    }
  });
};