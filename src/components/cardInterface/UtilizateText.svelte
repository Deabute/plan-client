<!-- UtilizateText.svelte Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { Unsubscriber } from 'svelte/store';
  import type { memTaskI } from '../../shared/interface';
  import { selectedUtilizationOption } from '../../stores/settingsStore';
  import {
    nowDurationStamp,
    recordingTaskParent,
  } from '../../stores/timeStore';
  import { getDurationStamp } from '../time/timeConvert';

  export let task: memTaskI;
  export let fraction: number | null = null;

  const { utilization } = task;
  let utilizationNumber: number = utilization;
  let utilizationText: string = getDurationStamp(utilization);

  const setUtilization = (millis: number) => {
    utilizationNumber = millis;
    utilizationText = getDurationStamp(millis);
  };

  // Subscribe to potentially ticking on a recording task
  let unsub: Unsubscriber | null = null;

  // Set this task to tick with the recording task clock
  // const setActiveFolder = async () => {
  //   unsub = nowDurationStamp.subscribe((duration) => {
  //     setUtilization(utilization + duration);
  //   });
  // };

  // if this task becomes a parent of the running task
  // then its utilization needs to tick with the clock
  recordingTaskParent.subscribe((parentId) => {
    if ($selectedUtilizationOption !== 'This Sprint') return;
    if (parentId === task.id) {
      unsub = nowDurationStamp.subscribe((duration) => {
        setUtilization(utilization + duration);
      });
    } else {
      if (unsub) {
        unsub();
        unsub = null;
      }
    }
  });

  // Remove subscription to history until adding that feature back is practical
  // utilizeRange.subscribe(async (range) => {
  //   if (!range.start && !range.end) return;
  //   if (unsub) {
  //     unsub();
  //     unsub = null;
  //   }
  //   if (
  //     $selectedUtilizationOption === 'This Sprint' &&
  //     $recordingTaskParent === task.id
  //   ) {
  //     setActiveFolder();
  //   } else {
  //     const millis = await compileUtilizedMillis(
  //       task.id,
  //       range.start,
  //       range.end,
  //     );
  //     setUtilization(millis);
  //   }
  // });
</script>

<span
  class={`${utilizationNumber <= fraction ? 'text-success' : 'text-danger'}`}
>
  {`${utilizationText} of ${
    fraction !== null ? getDurationStamp(fraction) : ''
  }`}
</span>
