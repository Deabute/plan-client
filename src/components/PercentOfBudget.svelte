<!-- PercentOfBudget.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { getUsedBudgetForTask } from '../indexDb/budgetDb';

  import type { memTaskI, taskI } from '../shared/interface';
  import { budgetStore } from '../stores/budgetStore';

  export let task: memTaskI | taskI;

  let percent: number = 0;

  getUsedBudgetForTask(task, $budgetStore.start).then((millisUsed) => {
    if (millisUsed) {
      percent = Math.floor((millisUsed / task.fraction) * 100);
    }
  });
</script>

<span class="col-2 budget-percent">{percent}%</span>

<style>
  .budget-percent {
    font-size: 0.75rem;
  }
</style>
