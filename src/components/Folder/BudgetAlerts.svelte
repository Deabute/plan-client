<!-- BudgetAlerts.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { overBudget, toAllocate } from '../../stores/taskStore';
  import { justHoursOrMinutes } from '../../shared/velocity';
</script>

{#if $overBudget || $toAllocate}
  <div class="small text-center alert alert-danger">
    {#if $overBudget}
      {`${justHoursOrMinutes(Math.abs($overBudget))} over-budget`}
    {:else if $toAllocate}
      {`${justHoursOrMinutes($toAllocate)} unallocated`}
    {/if}
  </div>
{/if}
