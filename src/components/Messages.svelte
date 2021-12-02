<!-- Messages.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { messageStore, clearMessages } from '../stores/messageStore';
</script>

{#if $messageStore.length}
  <div class="card m-1">
    <div class="card-body">
      <ul>
        {#each $messageStore as msg}
          <li>{msg}</li>
        {/each}
      </ul>
      <button class="btn btn-light btn-outline-dark" on:click={clearMessages}>
        Clear Messages
      </button>
    </div>
  </div>
{/if}

<style>
  ul {
    list-style-type: none;
  }
</style>
