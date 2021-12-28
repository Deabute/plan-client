<!-- ViewContainer.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import {
    activitiesColumnName,
    timelineColumnName,
  } from '../../stores/defaultData';
  import { showSideNav } from '../../indexDb/viewStoreDb';
  import { taskStore } from '../../stores/taskStore';

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

  const getLgDiv = (name: string, showSideNav: boolean): string => {
    if (name === 'SideNav') return showSideNav ? '2' : '1';
    if (name === activitiesColumnName) return '4';
    if (!showSideNav && name === timelineColumnName) return '4';
    return '3';
  };

  const getMdDiv = (name: string, showSideNav: boolean): string => {
    if (showSideNav) {
      return name === 'SideNav' ? '4' : '8';
    } else {
      return name === 'SideNav' ? '1' : '11';
    }
  };
</script>

<div
  {id}
  class={`${classPass} d-flex flex-column col-sm-${getMdDiv(
    id,
    $showSideNav,
  )} col-lg-${getLgDiv(id, $showSideNav)}${getViewClassContainer(
    isMobile,
    mobileView,
    desktopView,
  )}`}
>
  {#if id !== 'SideNav'}
    <div class="d-none d-sm-block card-header container mb-1">
      <div class="row text-center">
        <div>
          {id === activitiesColumnName && $taskStore.lineage[0].parentId !== '0'
            ? `Folder: ${$taskStore.lineage[0].body}`
            : id}
        </div>
      </div>
    </div>
  {/if}
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
