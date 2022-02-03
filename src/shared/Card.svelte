<!-- Card.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { memTaskI } from './interface';
  import FolderBudget from '../components/cardInterface/FolderBudget.svelte';
  import { editTask, moveTask } from '../stores/settingsStore';
  import MoveTaskOptions from '../components/cardInterface/MoveTaskOptions.svelte';
  import RecurEditBar from '../components/cardInterface/RecurEditBar.svelte';
  import { showDone, showTopChild, toggleView } from '../indexDb/viewStoreDb';
  import DueDate from '../components/cardInterface/DueDate.svelte';
  import BodyAndAction from '../components/ActionButtons/BodyAndAction.svelte';
  import OpenFolderButton from '../components/ActionButtons/OpenFolderButton.svelte';
  import RecycleButton from '../components/ActionButtons/RecycleButton.svelte';
  import CheckOffButton from '../components/ActionButtons/CheckOffButton.svelte';
  import ListTask from 'svelte-bootstrap-icons/lib/ListTask';
  import ArrowDownUp from 'svelte-bootstrap-icons/lib/ArrowDownUp';

  // Exposed component props
  export let task: memTaskI;
</script>

{#if task.status !== 'done' || $showDone}
  <div class="pb-1 border-bottom container-fluid" id={task.id}>
    {#if $moveTask}
      <div class="row text-center py-1">
        {#if $moveTask?.id !== task.id}
          <OpenFolderButton id={task.id} />
        {:else}
          <div class="col-1"><ArrowDownUp /></div>
        {/if}
        <BodyAndAction
          id={task.id}
          body={task.body}
          size="10"
          done={task.status === 'todo' ? false : true}
        />
      </div>
    {:else}
      <div class="row text-center py-1">
        {#if $showTopChild && task.topChild && $editTask?.id !== task.id}
          <div class="col-1" type="button" on:click={toggleView('topChild')}>
            <ListTask />
          </div>
        {:else if task.status !== 'todo'}
          <RecycleButton id={task.id} />
        {:else}
          <CheckOffButton id={task.id} />
        {/if}
        <BodyAndAction
          id={task.id}
          body={task.body}
          size="10"
          done={task.status === 'todo' ? false : true}
        />
      </div>
      <FolderBudget {task} />
      <RecurEditBar {task} />
      <DueDate {task} />
      {#if $showTopChild && task.topChild && $editTask?.id !== task.id}
        <div class="row text-center py-1">
          <CheckOffButton id={task.topChild.id} />
          <BodyAndAction
            id={task.topChild.id}
            body={task.topChild.body}
            grey={true}
            size="10"
          />
        </div>
      {/if}
    {/if}
    <MoveTaskOptions {task} />
  </div>
{/if}
