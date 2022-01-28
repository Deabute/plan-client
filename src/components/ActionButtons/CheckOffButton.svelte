<!-- CheckOffButton.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import Check from 'svelte-bootstrap-icons/lib/Check';
  import { checkOff } from '../../stores/taskStore';

  export let id: string;
  export let size = '1';
  // export let view = 'intent';
  // export let done: boolean = true;
</script>

<div class={`col-${size} text-success`} type="button" on:click={checkOff(id)}>
  <Check />
</div>
