<!-- Timeline.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import { timelineColumnName } from '../../stores/defaultData';
  import Timestamp from '../../shared/Timestamp.svelte';
  import { timeStore } from '../../stores/timeStore';
  import { page } from '../../indexDb/timelineDb';
  import {
    showTimelineColumn,
    showTimelineMobile,
  } from '../../indexDb/viewStoreDb';
  import ViewContainer from './ViewContainer.svelte';
  import Stopwatch from 'svelte-bootstrap-icons/lib/Stopwatch';
  import { nextUp } from '../../stores/agendaStore';
  import BodyAndAction from '../ActionButtons/BodyAndAction.svelte';
  import RecordActionButton from '../ActionButtons/RecordActionButton.svelte';

  let canPageDown = true;
  let canPageUp = false;

  let loadingNextHistory: boolean = false;
  let loadingPastHistory: boolean = false;

  const scrollHandler = (element) => {
    const { scrollHeight, scrollTop, clientHeight } = element.target;
    if (loadingNextHistory || loadingPastHistory) return;
    if (canPageDown && clientHeight + scrollTop >= scrollHeight) {
      loadingNextHistory = true;
      setTimeout(async () => {
        const { complete, newHistory } = await page($timeStore, true);
        canPageDown = complete ? false : true;
        canPageUp = true;
        $timeStore.history = newHistory;
        loadingNextHistory = false;
      });
    }

    if (canPageUp && scrollTop === 0) {
      loadingPastHistory = true;
      setTimeout(async () => {
        element.target.scrollTop = 40;
        const { complete, newHistory } = await page($timeStore);
        canPageUp = complete ? false : true;
        canPageDown = true;
        $timeStore.history = newHistory;
        loadingPastHistory = false;
      });
    }
  };

  let id = '1';
  let body = 'Going to need to add more task!';
  let cadence = 'zero';
  nextUp.subscribe(async (nextTask) => {
    if (nextTask) {
      id = nextTask.id;
      body = nextTask.body;
      cadence = nextTask.cadence;
    }
  });
</script>

<ViewContainer
  desktopView={$showTimelineColumn}
  mobileView={$showTimelineMobile}
  id={timelineColumnName}
  {scrollHandler}
>
  <svelte:fragment slot="headerText">
    <span>
      <Stopwatch />
      <span class="header">
        &nbsp;
        {`${timelineColumnName}`}
      </span>
    </span>
  </svelte:fragment>
  <svelte:fragment slot="staticHeader">
    <div class="border-bottom border-dark">
      <div class="pb-1 border-bottom container-fluid">
        <div class="row mb-1 text-center">
          {#if id !== '1'}
            <RecordActionButton {id} {body} {cadence} />
          {:else}
            <div class="col-1" />
          {/if}
          <BodyAndAction {body} {id} grey={true} />
        </div>
      </div>
      <Timestamp timestamp={$timeStore.now} inProgress={true} />
    </div>
  </svelte:fragment>
  <svelte:fragment slot="items">
    {#each $timeStore.history as timestamp (timestamp.start)}
      <Timestamp {timestamp} />
    {/each}
  </svelte:fragment>
</ViewContainer>

<style>
  .header {
    vertical-align: text-top;
  }
</style>
