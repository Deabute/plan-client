// grandchild_estimation Copyright 2021 Paul Beaudet MIT Licence
// Test if estimates correct bubble up from decedents
import { getDurationEstimate } from '../../src/shared/velocity';
import { TESTING_URL, MAIN_IDB_NAME } from './data';

// helpers for creating application data
const example: string = 'Task';
const NUMBER_OF_TASK: number = 4;
const somethingToClickOn = `${example} 1`;
const populateTask = () => {
  for (let i = 0; i < NUMBER_OF_TASK; i++) {
    cy.contains('Add Task').click();
    cy.get('input').type(`${example} ${i + 1} {enter}`);
  }
};
const nestAction = (action: () => void) => {
  action();
  for (let i = 0; i < NUMBER_OF_TASK - 1; i++) {
    cy.get('.btn').contains(somethingToClickOn).click();
    action();
  }
};
const unNest = () => {
  for (let i = 0; i < NUMBER_OF_TASK - 1; i++) {
    cy.get('.card.mb-3').contains(somethingToClickOn).click();
  }
};
const getVelocitySymbol = (taskAndNest: number): string => {
  const totalTask = taskAndNest * taskAndNest + 1;
  return getDurationEstimate(totalTask);
};

const completeSomeSubtask = () => {
  for (let i = 0; i < NUMBER_OF_TASK; i++) {
    // Looking to click on the first task which as a grandchild
    cy.get('.btn-success').first().click();
  }
};

const grandchildrenCompletedEstimate = (
  taskRemoved: number = NUMBER_OF_TASK,
): string => {
  const oneLessRow = taskRemoved - 1;
  const totalTask = taskRemoved * oneLessRow + 1;
  return getDurationEstimate(totalTask);
};

const estimateAllNested = (taskGrid: number = NUMBER_OF_TASK) => {
  const totalTask = taskGrid * taskGrid - (taskGrid - 1);
  return getDurationEstimate(totalTask);
};

indexedDB.deleteDatabase(MAIN_IDB_NAME);
describe('Correctly estimates based on grandchildren', () => {
  it('Has the right estimation on parent', () => {
    cy.visit(TESTING_URL);
    nestAction(populateTask);
    unNest();
    const expectedEstimate = getVelocitySymbol(NUMBER_OF_TASK);
    cy.get('.time-estimate').contains(expectedEstimate);
  });
  it('has the right estimation on siblings', () => {
    const expectedEstimate = estimateAllNested();
    cy.get('.parent').first().contains(expectedEstimate);
  });
});

describe('has correct estimate after completing task', () => {
  it('When top grandchild tasks are completed', () => {
    completeSomeSubtask();
    cy.get('.time-estimate').contains(grandchildrenCompletedEstimate());
  });
  it('When sibling task are completed', () => {});
});
