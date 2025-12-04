import { login } from '../functions/login.cy';

export const generarPartidosEliminacion = (email = '', contraseña = '', nombre, inCampeonatos = false) => {
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
  cy.wait(500);

  cy.intercept('GET', '/api/campeonato/*').as('getCampeonato');
  cy.contains('h1', nombre, { timeout: 20000 })
    .first()
    .parent('div')
    .parent('div.bg-white')
    .find('a')
    .contains('VER MÁS')
    .click({ force: true });
  cy.wait('@getCampeonato', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 304]);
  cy.wait(2000);

  cy.get('button[title="Etapa Siguiente"]', { timeout: 20000 }).click({ force: true });
  cy.wait(100);

  cy.intercept('GET', '/api/reservas').as('getReservas');
  cy.get('button[title="Ir al partido"]', { timeout: 20000 }).eq(-1).click({ force: true });
  cy.url({ timeout: 20000 }).should('include', '/partido/');
  cy.wait('@getReservas', { timeout: 20000 });

  cy.wait(6000);
  cy.get('body', { timeout: 20000 }).then($body2 => {
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
      cy.wait(500);
    } else if (existeAceptarPropuesta) {
      cy.intercept('PUT', '/api/partidos/*/confirmar-horario').as('confirmarDisponibilidad');
      cy.contains('button', 'Aceptar Propuesta', { timeout: 20000 }).first().click({ force: true });
      cy.wait('@confirmarDisponibilidad', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
      cy.go('back');
      cy.wait(500);
    }else{
      cy.log('No hay acciones para realizar en el partido');
      cy.go('back');
      cy.wait(500);
    }
  });
};