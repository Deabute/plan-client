// increment_rating Copyright 2021 Paul Beaudet MIT Licence
// Test ability to increment rating
import { getDurationEstimate } from '../../src/shared/velocity';
import { fibonacciScale } from '../../src/stores/defaultData';
import { TESTING_URL, MAIN_IDB_NAME } from './data';

// helpers for creating application data
const example: string = 'Task';
const RATING_CLICKS: number = 7;
const populateTask = (taskGrindNumber: number) => {
  for (let i = 0; i < taskGrindNumber; i++) {
    cy.contains('Add Task').click();
    cy.get('input').type(`${example} ${i + 1} {enter}`);
  }
};

const expectedVelocitySymbol = (increase: number): string => {
  const totalTask = fibonacciScale[increase];
  return getDurationEstimate(totalTask);
};

indexedDB.deleteDatabase(MAIN_IDB_NAME);
describe('User ability to change ratings', () => {
  it('gives correct estimate for each rating increase', () => {
    cy.visit(TESTING_URL);
    populateTask(1);
    for (let i = 0; i < RATING_CLICKS; i++) {
      const rating = i + 2;
      cy.get('.card-body > .effort').first().click();
      const expectedEstimate = expectedVelocitySymbol(rating);
      cy.get('#Todo > .card-header > .time-estimate').contains(
        expectedEstimate,
      );
      cy.get('.card-body > .effort').first().contains(`${rating}P`);
    }
  });
});
