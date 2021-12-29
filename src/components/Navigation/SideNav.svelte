<!-- SideNav.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import UniNav from './UniNav.svelte';
  export let mobile: boolean = false;
</script>

<div class="flex-shrink-0 text-white bg-dark pe-2">
  <UniNav {mobile} />
</div>
