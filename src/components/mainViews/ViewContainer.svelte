<!-- ViewContainer.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  export let isMobile: boolean = false;
  export let desktopView: boolean;
  export let mobileView: boolean;
  export let id: string;
  export let scrollHandler: (e: any) => void = () => {};
  export let classPass: string = '';

  const getViewClassContainer = (
    mobile: boolean,
    mView: boolean,
    dView: boolean,
  ): string => {
    if (mobile) {
      return mView ? ' w-100 d-block' : ' w-0 d-none';
    } else {
      return dView ? ' border-end d-block' : ' d-none';
    }
  };
</script>

<div
  {id}
  class={`${classPass} d-flex flex-column col-sm ${getViewClassContainer(
    isMobile,
    mobileView,
    desktopView,
  )}`}
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
