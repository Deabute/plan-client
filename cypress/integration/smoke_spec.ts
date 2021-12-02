// smoke_spec Copyright 2021 Paul Beaudet MIT License
// Checks for released magic smoke
import { MAIN_IDB_NAME, TESTING_URL } from './data';
indexedDB.deleteDatabase(MAIN_IDB_NAME);

describe('Looking for smoke', () => {
  it('Loads with expected list', () => {
    cy.visit(TESTING_URL);
    cy.contains('Todo');
    cy.contains('Done');
    cy.contains('Time');
  });

  const example: string = 'Example Task';
  it('Can add a task', () => {
    cy.contains('Add Task').click();
    cy.get('input').type(example + '{enter}');
    cy.get('.card-body > .card-title').eq(1).should('have.text', example);
  });

  it('Can complete a task', () => {
    cy.get('.btn-success').first().click();
    cy.get('#Done .card-title').should('have.text', 'Plan');
  });

  it('Can add a second task', () => {
    cy.contains('Add Task').click();
    cy.get('input').type('test' + '{enter}');
    cy.get('#Todo .card-title').eq(1).should('have.text', 'test');
  });

  it('can record a task', () => {
    cy.contains('●').first().click();
    cy.get('#Time .card-title').first().should('have.text', example);
  });
});
