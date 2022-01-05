<!-- UtilizateText.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { Unsubscriber } from 'svelte/store';
  import { compileUtilizedMillis } from '../../indexDb/timelineDb';
  import type { memTaskI } from '../../shared/interface';
  import { budgetStore } from '../../stores/budgetStore';
  import {
    selectedUtilizationOption,
    utilizeRange,
  } from '../../stores/settingsStore';
  import {
    nowDurationStamp,
    recordingTaskParent,
    timeStore,
  } from '../../stores/timeStore';
  import { getDurationStamp } from '../time/timeConvert';

  export let task: memTaskI;
  export let fraction: number | null = null;

  let utilization: string = '?';
  let utilizedNumber: number = 0;

  const setUtilization = (millis: number) => {
    utilizedNumber = millis;
    utilization = getDurationStamp(millis);
  };

  compileUtilizedMillis(task.id, $budgetStore.start).then((millis) => {
    setUtilization(millis);
  });

  // Subscribe to potentially ticking on a recording task
  let unsub: Unsubscriber | null = null;

  const setActiveFolder = async () => {
    const millis = await compileUtilizedMillis(
      task.id,
      $budgetStore.start,
      $timeStore.now.start,
    );
    unsub = nowDurationStamp.subscribe((duration) => {
      setUtilization(millis + duration);
    });
  };

  recordingTaskParent.subscribe((parentId) => {
    if ($selectedUtilizationOption !== 'This Sprint') return;
    if (parentId === task.id) {
      setActiveFolder();
    } else {
      if (unsub) {
        unsub();
        unsub = null;
      }
    }
  });

  utilizeRange.subscribe(async (range) => {
    if (!range.start && !range.end) return;
    if (unsub) {
      unsub();
      unsub = null;
    }
    if (
      $selectedUtilizationOption === 'This Sprint' &&
      $recordingTaskParent === task.id
    ) {
      setActiveFolder();
    } else {
      console.log(`${task.id} - ${range.start}/${range.end}`);
      const millis = await compileUtilizedMillis(
        task.id,
        range.start,
        range.end,
      );
      setUtilization(millis);
    }
  });
</script>

<span class={`${utilizedNumber <= fraction ? 'text-success' : 'text-danger'}`}>
  {`${utilization} of ${fraction !== null ? getDurationStamp(fraction) : ''}`}
</span>
