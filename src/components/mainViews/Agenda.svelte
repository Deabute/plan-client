<!-- Agenda.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { pageAgenda } from '../../indexDb/taskDb';
  import {
    showAgendaColumn,
    showAgendaMobile,
  } from '../../indexDb/viewStoreDb';
  import { agendaStore } from '../../stores/agendaStore';
  import { agendaColumnName } from '../../stores/defaultData';
  import AgendaItem from '../AgendaComponents/AgendaItem.svelte';
  import ViewContainer from './ViewContainer.svelte';
  import CalendarEvent from 'svelte-bootstrap-icons/lib/CalendarEvent';

  let canPageDown = true;
  let canPageUp = true;

  let loadingNextHistory: boolean = false;
  let loadingPastHistory: boolean = false;

  const scrollHandler = (element) => {
    const { scrollHeight, scrollTop, clientHeight } = element.target;
    if (loadingNextHistory || loadingPastHistory) return;
    if (canPageDown && clientHeight + scrollTop >= scrollHeight) {
      loadingNextHistory = true;
      setTimeout(async () => {
        const { complete, newAgenda } = await pageAgenda($agendaStore, false);
        canPageDown = !complete;
        canPageUp = true;
        $agendaStore = newAgenda;
        loadingNextHistory = false;
      });
    }

    if (canPageUp && scrollTop === 0) {
      loadingPastHistory = true;
      setTimeout(async () => {
        element.target.scrollTop = 40;
        const { complete, newAgenda } = await pageAgenda($agendaStore);
        canPageUp = !complete;
        canPageDown = true;
        $agendaStore = newAgenda;
        loadingPastHistory = false;
      });
    }
  };
</script>

<ViewContainer
  desktopView={$showAgendaColumn}
  mobileView={$showAgendaMobile}
  id={agendaColumnName}
  {scrollHandler}
>
  <svelte:fragment slot="headerText">
    <span>
      <CalendarEvent />
      <span class="header">
        &nbsp;
        {agendaColumnName}
      </span>
    </span>
  </svelte:fragment>
  <svelte:fragment slot="items">
    {#each $agendaStore as task (task.id)}
      <AgendaItem {task} />
    {:else}
      <span class="text-center">Nothing due</span>
    {/each}
  </svelte:fragment>
</ViewContainer>

<style>
  .header {
    vertical-align: text-top;
  }
</style>
