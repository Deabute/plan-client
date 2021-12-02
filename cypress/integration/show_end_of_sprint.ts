// increment_rating Copyright 2021 Paul Beaudet MIT Licence
// Test ability to increment rating
import { TESTING_URL, MAIN_IDB_NAME } from './data';

// helpers for creating application data
const example: string = 'Task';

const populateTask = () => {
  for (let i = 0; i < 21; i++) {
    cy.get('#input-bar').type(`${example} ${i + 1} {enter}`);
    for (let j = 0; j < 7; j++) {
      cy.get('.effort').first().click();
    }
  }
};

indexedDB.deleteDatabase(MAIN_IDB_NAME);
describe('End of sprint', () => {
  it('Shows end of sprint', () => {
    cy.visit(TESTING_URL);
    populateTask();
  });
});
