// default_task Copyright 2021 Paul Beaudet MIT Licence
// Figures when default values populate properly
import { TESTING_URL, MAIN_IDB_NAME } from './data';

indexedDB.deleteDatabase(MAIN_IDB_NAME);
describe('conditions for default task to populate', () => {
  it('Populates new task on default task completion', () => {
    cy.visit(TESTING_URL);
    // Default set-up has a plan card in time column
    cy.get('#Time').contains('Plan');
    cy.get('.btn-success').first().click();
    cy.get('#Todo').contains('Plan');
  });
});
