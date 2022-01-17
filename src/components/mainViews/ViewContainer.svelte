<!-- ViewContainer.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { desktopMode } from '../../indexDb/viewStoreDb';

  export let desktopView: boolean;
  export let mobileView: boolean;
  export let id: string;
  export let scrollHandler: (e: any) => void = () => {};
  export let classPass: string = '';

  const getShowing = (desktop: boolean, m: boolean, d: boolean): boolean => {
    return desktop ? d : m;
  };
</script>

{#if getShowing($desktopMode, mobileView, desktopView)}
  <div
    {id}
    class={`${classPass} d-flex flex-column col-sm border-end border-start w-100`}
  >
    <div class="d-none d-sm-block card-header mb-1">
      <div class="row text-center">
        <slot name="headerText" />
      </div>
    </div>
    <slot name="staticHeader" />
    <div class={`scroll`} on:scroll={scrollHandler}>
      <slot name="items" />
    </div>
  </div>
{/if}

<style>
  .scroll {
    overflow-y: auto;
    overflow-x: hidden;
  }
  .scroll::-webkit-scrollbar {
    width: 1.25em;
    height: 0.5em;
  }

  .scroll::-webkit-scrollbar-track {
    background: white;
  }

  .scroll::-webkit-scrollbar-thumb {
    background: grey;
  }

  .scroll::-webkit-scrollbar-thumb:hover {
    background: black;
  }

  @supports (scrollbar-color: grey white) {
    * {
      scrollbar-color: grey white;
    }
  }
</style>
