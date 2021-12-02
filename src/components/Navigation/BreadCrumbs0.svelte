<!-- BreadCrumbs.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { loadTask, taskStore } from '../../stores/taskStore';
</script>

{#if $taskStore.lineage[0].parentId !== '0'}
  <nav class="window-lineage">
    {#each [...$taskStore.lineage].reverse() as ancestor, i}
      {#if i}
        <span>{'/'}</span>
      {/if}
      {#if i + 1 === $taskStore.lineage.length}
        <span class="active-folder">
          {ancestor.body}
        </span>
      {:else}
        <button
          class="btn-lineage"
          on:click={() => {
            loadTask(ancestor, false);
          }}
        >
          {ancestor.body}
        </button>
      {/if}
    {/each}
  </nav>
{/if}

<style>
  .active-folder {
    color: grey;
  }
  .btn-lineage {
    border: none;
    padding: 0;
    text-decoration: underline;
    color: #069;
  }
  .window-lineage {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }
</style>
