<script lang="ts">
  import BoxArrowDown from 'svelte-bootstrap-icons/lib/BoxArrowDown';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { taskI } from '../../shared/interface';
  import { createExport } from '../../stores/settingsStore';
  import StampEdit from '../../shared/StampEdit.svelte';
  import { figureExportValues } from '../../indexDb/timelineDb';
  import { hourAndMinutesObj } from '../time/timeConvert';

  export let task: taskI;

  const now = Date.now();
  let generated: boolean = false;
  // default to two weeks prior
  let fromStamp: number = now - 1209600000;
  let fromEdited: Writable<number> = writable(fromStamp);
  let toStamp: number = now;
  let toEdited: Writable<number> = writable(toStamp);

  let tsv: string = '';

  const downloadTSV = () => {
    // console.log(tsv);
    const blob = new Blob([tsv], { type: 'text/tsv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // make this more specific
    const fromDate = new Date($fromEdited);
    const toDate = new Date($toEdited);
    const month_day_from = `${fromDate.getMonth()}_${fromDate.getDate()}_${fromDate.getFullYear()}`;
    const month_day_to = `${toDate.getMonth()}_${toDate.getDate()}_${toDate.getFullYear()}`;
    link.download = `export_${month_day_from}_to_${month_day_to}.tsv`;
    link.click();
    tsv = '';
    generated = false;
  };

  const exportFolder = () => {
    tsv = 'Task\tHours\tMinutes\tOccurrences\n'; // header row
    figureExportValues($fromEdited, $toEdited, task.id).then((dataArray) => {
      dataArray.forEach((data) => {
        const { hour, minute } = hourAndMinutesObj(data.duration);
        tsv += `${data.body}\t${hour}\t${minute}\t${data.occurrences}\n`;
      });
    });
    generated = true;
    // gather data recursively of parent and children
  };
</script>

{#if $createExport && $createExport.id == task.id}
  <div class="row text-center">
    <span>Export from first to second date</span>
  </div>
  <!--From this time (Default: past 2 week delta)-->
  <div class="row">
    <StampEdit stamp={fromStamp} bind:editedStamp={$fromEdited} />
  </div>
  <!-- To this time (Default: Now) -->
  <div class="row">
    <StampEdit stamp={toStamp} bind:editedStamp={$toEdited} />
  </div>
  <!-- Generate/Export -->
  <div class="row">
    <div class="btn-group btn-group-sm col-12" role="group">
      <button class="btn btn-outline-dark" on:click={exportFolder}>
        Generate
      </button>
      {#if generated}
        <button
          class="btn btn-outline-dark"
          type="button"
          on:click={downloadTSV}
        >
          <BoxArrowDown /> Download
        </button>
      {/if}
    </div>
  </div>
{/if}
