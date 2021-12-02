<!-- DurationEffortBudget.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI, taskI } from '../shared/interface';
  import { getDurationEstimate } from '../shared/velocity';
  import { fibonacciScale } from '../stores/defaultData';
  import { tachStore } from '../stores/velocityStore';
  import EffortButton from './EffortButton.svelte';
  import PercentOfBudget from './PercentOfBudget.svelte';

  export let task: memTaskI | taskI;
</script>

{#if task.fraction}
  <!-- Show hours of budget used -->
  <PercentOfBudget {task} />
{:else if fibonacciScale[task.rating] >= task.effort}
  <!-- show effort button current rating exceeds child effort -->
  <EffortButton {task} />
{:else}
  <!-- Show estimate in other cases -->
  <span class={`estimate col-2`}>
    {getDurationEstimate(task.effort, $tachStore)}
  </span>
{/if}

<style>
  .estimate {
    font-size: 0.75rem;
  }
</style>
