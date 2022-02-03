<!-- BodyAndAction.svelte Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import { updateTaskSafe } from '../../indexDb/taskDb';
  import { cancelFund } from '../../stores/fundingStore';
  import { editTask, moveTask } from '../../stores/settingsStore';
  import { loadChildren, refreshAllViews } from '../../stores/taskStore';
  import PencilSquare from 'svelte-bootstrap-icons/lib/PencilSquare';

  export let id: string;
  export let body: string;
  export let size: string = '10';
  export let done: boolean = false;
  export let grey: boolean = $moveTask?.id === id ? true : false;

  let editBody: boolean = false;
  let bodyChange: string = body.valueOf();
  $: bodyChange = body.valueOf();
  let editColor: string = 'text-black';
  let blink: boolean = true;
  $: editColor = editBody ? 'text-warning' : 'text-black';

  const open = async () => {
    if ($moveTask?.id === id) return;
    cancelFund();
    loadChildren(id);
    $editTask = null;
  };

  const timeout = 7;
  let blinker = null;
  let count = 0;

  const makeBodyChange = async () => {
    clearInterval(blinker);
    count = 0;
    if (!bodyChange || bodyChange === body) return;
    await updateTaskSafe({ id, body: bodyChange });
    await refreshAllViews();
  };

  const onInput = () => {
    if (blinker) {
      count = 0;
      clearInterval(blinker);
    }
    blinker = setInterval(() => {
      blink = !blink;
      editColor = blink ? 'text-warning' : 'text-black';
      count++;
      if (count > timeout) {
        editBody = false;
        makeBodyChange();
      }
    }, 500);
  };

  const toggleEdit = () => {
    editBody = !editBody;
    if (!editBody) makeBodyChange();
  };
</script>

{#if editBody}
  <div class={`col-${size}${grey ? ' text-secondary' : ''}`} type="button">
    <span
      id={`edit-${id}`}
      class="form-control text-center border-info"
      type="input"
      contenteditable
      on:input={onInput}
      bind:textContent={bodyChange}
    >
      {body}
    </span>
  </div>
{:else}
  <div
    class={`col-${size} text-center${grey ? ' text-secondary' : ''}`}
    type="button"
    on:click={open}
  >
    {#if done}
      <s>{body}</s>
    {:else}
      {body}
    {/if}
  </div>
{/if}
{#if !grey && !$moveTask}
  <div class={`col-1 ${editColor}`} type="button" on:click={toggleEdit}>
    <PencilSquare />
  </div>
{/if}
