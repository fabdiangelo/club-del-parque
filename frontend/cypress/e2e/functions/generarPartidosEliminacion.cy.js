import { login } from '../functions/login.cy';

export const generarPartidosEliminacion = (email = '', contraseña = '', nombre, inCampeonatos = false) => {
  if(email && contraseña) {
    login(email, contraseña);
  }

  if(!inCampeonatos){
    cy.get('a').contains('Campeonatos').first().click();
  }

  cy.url().then((currentUrl) => {
    if (!currentUrl.endsWith('/campeonatos')) {
      cy.get('a').contains('Campeonatos').first().click();
    }
  });
  cy.wait(500);

  cy.intercept('GET', '/api/campeonato/*').as('getCampeonato');
  cy.contains('h1', nombre)
    .first()
    .parent('div')
    .parent('div.bg-white')
    .find('a')
    .contains('VER MÁS')
    .click()
  cy.wait('@getCampeonato').its('response.statusCode').should('be.oneOf', [200, 304]);
  cy.wait(2000);

  cy.get('button[title="Etapa Siguiente"]').click();
  cy.wait(100);

  cy.intercept('GET', '/api/reservas').as('getReservas');
  cy.get('button[title="Ir al partido"]').eq(-1).click();
  cy.url().should('include', '/partido/');
  cy.wait('@getReservas');

  cy.wait(6000);
  cy.get('body').then($body2 => {
    const existeGenerarPropuesta = $body2.text().includes('Generar Propuesta');
    const existeAceptarPropuesta = $body2.text().includes('Aceptar Propuesta');
    if (existeGenerarPropuesta) {
      cy.contains('button', 'Generar Propuesta').click();
      cy.get('div.grid button').first().click();
      cy.get('select').eq(0).find('option').eq(1).then($opt => {
        cy.get('select').eq(0).select($opt.val());
      });
      cy.get('select').eq(1).find('option').eq(2).then($opt => {
        cy.get('select').eq(1).select($opt.val());
      });
      cy.contains('button', 'Agregar').click();

      cy.intercept('POST', '/api/partidos/*/disponibilidad').as('enviarDisponibilidad');
      cy.contains('button', 'Enviar disponibilidad').click();
      cy.wait('@enviarDisponibilidad').its('response.statusCode').should('eq', 200);

      cy.go('back');
      cy.wait(500);
    } else if (existeAceptarPropuesta) {
      cy.intercept('PUT', '/api/partidos/*/confirmar-horario').as('confirmarDisponibilidad');
      cy.contains('button', 'Aceptar Propuesta').first().click();
      cy.wait('@confirmarDisponibilidad').its('response.statusCode').should('eq', 200);
      cy.go('back');
      cy.wait(500);
    }else{
      console.log('No hay acciones para realizar en el partido');
      cy.go('back');
      cy.wait(500);
    }
  });
};