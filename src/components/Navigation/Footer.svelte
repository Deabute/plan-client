<!-- Footer.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import {
    mobileToggle,
    showActivityMobile,
    showAgendaMobile,
    showTimelineMobile,
  } from '../../indexDb/viewStoreDb';
  import Folder from 'svelte-bootstrap-icons/lib/Folder';
  import Stopwatch from 'svelte-bootstrap-icons/lib/Stopwatch';
  import CalendarEvent from 'svelte-bootstrap-icons/lib/CalendarEvent';
  import FolderPlus from 'svelte-bootstrap-icons/lib/FolderPlus';
  import AddFolder from './AddFolder.svelte';
  import List from 'svelte-bootstrap-icons/lib/List';
  import { showAddFolder, toggleAddFolder } from '../../stores/settingsStore';
  import UniNav from './UniNav.svelte';
</script>

<div class="container-sm fixed-bottom bg-dark d-block d-sm-none">
  {#if $showAddFolder}
    <AddFolder />
  {/if}
  <ul class="nav nav-tabs row pt-1">
    <li class="nav-item col-2">
      <button
        class={`row nav-link text-white`}
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileMenu"
        role="button"
        aria-controls="mobileMenu"
      >
        <span aria-label="Menu options"><List /></span>
      </button>
    </li>
    <li class="nav-item col-2">
      <button
        class={`row nav-link${$showActivityMobile ? ' active' : ' text-white'}`}
        on:click={mobileToggle('activity')}
      >
        <span aria-label="show folder view"><Folder /></span>
      </button>
    </li>
    <li class="nav-item col-2">
      <button
        class={`row nav-link${$showTimelineMobile ? ' active' : ' text-white'}`}
        on:click={mobileToggle('timeline')}
      >
        <span aria-label="Show timeline"><Stopwatch /></span>
      </button>
    </li>
    <li class="nav-item col-2">
      <button
        class={`row nav-link${$showAgendaMobile ? ' active' : ' text-white'}`}
        on:click={mobileToggle('agenda')}
      >
        <span aria-label="Show task by due date"><CalendarEvent /></span>
      </button>
    </li>
    <li class="nav-item col-2">
      <button
        class={`row nav-link${$showAddFolder ? ' active' : ' text-white'}`}
        on:click={toggleAddFolder}
      >
        <span aria-label="toggle add folder input"><FolderPlus /></span>
      </button>
    </li>
  </ul>
</div>

<div
  class={`offcanvas offcanvas-start bg-dark text-white`}
  tabindex="-1"
  id="mobileMenu"
  aria-labelledby="mobileMenuLabel"
>
  <UniNav mobile={true} offcanvas={true} />
</div>
