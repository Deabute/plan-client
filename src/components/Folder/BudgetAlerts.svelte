<!-- BudgetAlerts.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { overBudget, toAllocate } from '../../stores/taskStore';
  import { hoursOrMinutesString } from '../time/timeConvert';
</script>

{#if $overBudget || $toAllocate}
  <div class="small text-center alert alert-danger">
    {#if $overBudget}
      {`${hoursOrMinutesString(Math.abs($overBudget))} over-budget`}
    {:else if $toAllocate}
      {`${hoursOrMinutesString($toAllocate)} unallocated`}
    {/if}
  </div>
{/if}
