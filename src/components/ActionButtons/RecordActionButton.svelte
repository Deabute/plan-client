<!-- RecordActionButton Copyright 2022 Paul Beaudet MIT License -->
<script lang="ts">
  import RecordBtn from 'svelte-bootstrap-icons/lib/RecordBtn';
  import { newTimeStamp, refreshTime } from '../../stores/timeStore';

  export let id: string;
  export let body: string;
  export let size = '1';

  const record = async () => {
    await newTimeStamp(id, body);
    await refreshTime(false);
  };
</script>

<div class={`col-${size} text-danger`} type="button" on:click={record}>
  <RecordBtn />
</div>
