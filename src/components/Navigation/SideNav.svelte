<!-- SideNav.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import ViewContainer from '../mainViews/ViewContainer.svelte';
  import UniNav from './UniNav.svelte';

  export const mobile: boolean = false;
</script>

<ViewContainer
  desktopView={true}
  mobileView={false}
  id="SideNav"
  classPass={'flex-shrink-0 text-white bg-dark'}
>
  <UniNav slot="items" />
</ViewContainer>
