<!-- EffortButton.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI, taskI } from '../shared/interface';
  import { fibonacciScale } from '../stores/defaultData';
  import { incrementEffort } from '../stores/taskStore';

  export let task: memTaskI | taskI;

  const incrementRating = (event: Event) => {
    event.stopPropagation();
    incrementEffort(task);
  };
</script>

<button
  class={`effort col-2 btn-sm btn-outline-dark`}
  disabled={fibonacciScale[task.rating] < task.effort}
  on:click={incrementRating}
>
  {`${task.rating}`}
</button>
