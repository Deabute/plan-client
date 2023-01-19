<script lang="ts">
  import BoxArrowDown from 'svelte-bootstrap-icons/lib/BoxArrowDown';
  import type { taskI } from '../../shared/interface';
  import { toggleCreateExport } from '../../stores/settingsStore';

  export let task: taskI;
</script>

<button
  class="btn btn-outline-dark"
  type="button"
  on:click={toggleCreateExport(task)}
>
  <BoxArrowDown />
</button>
