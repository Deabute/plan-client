<!-- UniNav.svelte Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import {
    showActivityColumn,
    showAgendaColumn,
    showTimelineColumn,
    showTopChild,
    toggleView,
    showSideNav,
    showActivityMobile,
    showTimelineMobile,
    showAgendaMobile,
    mobileToggle,
    desktopMode,
    showDone,
  } from '../../indexDb/viewStoreDb';
  import {
    activitiesColumnName,
    agendaColumnName,
    DAYS_SHORT,
    MONTH_SHORT,
    ProductName,
    timelineColumnName,
    weekInMillis,
  } from '../../stores/defaultData';
  import Folder from 'svelte-bootstrap-icons/lib/Folder';
  import Stopwatch from 'svelte-bootstrap-icons/lib/Stopwatch';
  import CalendarEvent from 'svelte-bootstrap-icons/lib/CalendarEvent';
  import List from 'svelte-bootstrap-icons/lib/List';
  import ListTask from 'svelte-bootstrap-icons/lib/ListTask';
  // import ClockHistory from 'svelte-bootstrap-icons/lib/ClockHistory';
  import ArrowDownUp from 'svelte-bootstrap-icons/lib/ArrowDownUp';
  import BoxArrowUpRight from 'svelte-bootstrap-icons/lib/BoxArrowUpRight';
  import WifiOff from 'svelte-bootstrap-icons/lib/WifiOff';
  import Github from 'svelte-bootstrap-icons/lib/Github';
  import InfoCircle from 'svelte-bootstrap-icons/lib/InfoCircle';
  import Phone from 'svelte-bootstrap-icons/lib/Phone';
  import Laptop from 'svelte-bootstrap-icons/lib/Laptop';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import Cloud from 'svelte-bootstrap-icons/lib/Cloud';
  import CaretDown from 'svelte-bootstrap-icons/lib/CaretDown';
  import CaretRight from 'svelte-bootstrap-icons/lib/CaretRight';
  import CloudArrowUp from 'svelte-bootstrap-icons/lib/CloudArrowUp';
  import CheckSquare from 'svelte-bootstrap-icons/lib/CheckSquare';
  import HourglassSplit from 'svelte-bootstrap-icons/lib/HourglassSplit';
  import {
    showFreshStart,
    showMultiDevice,
    toggleSettingDialog,
  } from '../../stores/settingsStore';
  import {
    peerSyncEnabled,
    rtcPeers,
    syncingDown,
    syncingUp,
  } from '../../stores/peerStore';
  import type { peersI } from '../../connections/connectInterface';
  import { connectionStatus, syncStatus } from '../../stores/peerStore';
  import { get12Hour } from '../time/timeConvert';
  import { budgetStore } from '../../stores/budgetStore';
  import type { budgetI } from '../../shared/interface';
  import { learnLinks } from './navLanguage';

  export let offcanvas: boolean = false;
  const getViewClass = (
    desktop: boolean,
    dView: boolean,
    mView: boolean,
  ): string => {
    let ourView = desktop ? dView : mView;
    return ourView ? ' selected' : ' not-selected';
  };

  const toggle = (name: string) => {
    return () => {
      if ($desktopMode) toggleView(name)();
      else mobileToggle(name)();
    };
  };

  const getSyncStatus = (peers: peersI[]): string => {
    // show status of first peer detected as connected
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].connected) {
        return peers[i].sank ? 'text-success' : 'text-warning';
      }
    }
    return $syncingUp || $syncingDown ? ' text-warning' : '';
  };

  const getSprintEndDate = ({ start, frame }: budgetI) => {
    const endDate = new Date(start + frame);
    let hour = endDate.getHours();
    const meridium = hour > 11 ? 'PM' : 'AM';
    hour = get12Hour(hour);
    return `End: ${DAYS_SHORT[endDate.getDay()]} ${
      MONTH_SHORT[endDate.getMonth()]
    } ${endDate.getDate()}, ${hour}${meridium}`;
  };

  let showLearnLinks: boolean = false;
  const toggleLearn = () => {
    showLearnLinks = !showLearnLinks;
  };
</script>

<div class={offcanvas ? 'off-canvas-header' : ''}>
  <span
    class={`${offcanvas ? 'offcanvas-title ' : ''}ps-2 mt-${
      $showSideNav ? '1' : '3'
    } rounded d-flex not-selected fs-4 align-items-center`}
    on:click={offcanvas ? () => {} : toggleView('sideNav')}
    id="mobileMenuLabel"
    data-bs-dismiss={offcanvas ? 'offcanvas' : ''}
  >
    {#if !offcanvas}<List />{/if}
    {#if $showSideNav}<span class="ps-1">{ProductName}</span>{/if}
    {#if offcanvas}
      <button
        type="button"
        class="btn-close btn-close-white text-reset ms-2"
        aria-label="Close"
      />
    {/if}
  </span>
</div>
<div class={offcanvas ? 'offcanvas-body' : ''}>
  {#if $peerSyncEnabled}
    <hr />
    {#if $showSideNav}<span class="ms-1 fs-5">Status</span>{/if}
    <ul class="nav nav-pills flex-column mb-auto">
      <li class={`p-1 nav-item ms-1`}>
        {#if $connectionStatus === 'Offline' || $connectionStatus === 'Disconnected'}
          <WifiOff />
        {:else if $connectionStatus === 'Cloud'}
          <Cloud />
        {:else if $connectionStatus === 'P2P'}
          <Laptop />
        {/if}
        {#if $showSideNav}
          <span class="rounded">
            {$connectionStatus}
          </span>
        {/if}
      </li>
      <li class={`p-1 nav-item ms-1`}>
        {#if $syncStatus === 'Syncing'}
          <ArrowDownUp />
        {:else if $syncStatus === 'Idle'}
          <HourglassSplit />
        {:else if $syncStatus === 'Pending Upload'}
          <CloudArrowUp />
        {/if}
        {#if $showSideNav}
          <span class="rounded">
            {$syncStatus}
          </span>
        {/if}
      </li>
    </ul>
  {/if}
  <!-- Views -->
  <hr />
  {#if $showSideNav}<span class="ms-1 fs-5">Views</span>{/if}
  <ul class="nav nav-pills flex-column mb-auto">
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`p-1 nav-item${getViewClass(
        $desktopMode,
        $showActivityColumn,
        $showActivityMobile,
      )}`}
      type="button"
      on:click={toggle('activity')}
    >
      <span class={`p-1`}><Folder /></span>
      {#if $showSideNav}
        <span>{activitiesColumnName}</span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`p-1 nav-item${getViewClass(
        $desktopMode,
        $showTimelineColumn,
        $showTimelineMobile,
      )}`}
      type="button"
      on:click={toggle('timeline')}
    >
      <span class={`p-1`}><Stopwatch /></span>
      {#if $showSideNav}
        <span>{timelineColumnName}</span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`p-1 nav-item${getViewClass(
        $desktopMode,
        $showAgendaColumn,
        $showAgendaMobile,
      )}`}
      type="button"
      on:click={toggle('agenda')}
    >
      <span class={`p-1`}><CalendarEvent /></span>
      {#if $showSideNav}
        <span>{agendaColumnName}</span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`nav-item p-1 ${$showTopChild ? 'selected' : 'not-selected'}`}
      type="button"
      on:click={toggleView('topChild')}
    >
      <span class={`p-1`}><ListTask /></span>
      {#if $showSideNav}
        <span> Top-Task </span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`nav-item p-1 ${$showDone ? 'selected' : 'not-selected'}`}
      type="button"
      on:click={toggleView('showDone')}
    >
      <span class={`p-1`}><CheckSquare /></span>
      {#if $showSideNav}
        <span>{`${$showDone ? 'Hide' : 'Show'} done`}</span>
      {/if}
    </li>
  </ul>
  <!-- Settings -->
  <hr />
  {#if $showSideNav}<span class="ms-1 fs-5">Settings</span>{/if}
  <ul class="nav nav-pills flex-column mb-auto">
    <li
      class={`nav-item rounded p-1 ms-1 ${
        $showMultiDevice ? 'selected' : 'not-selected'
      } ${getSyncStatus($rtcPeers)}`}
      type="button"
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      on:click={toggleSettingDialog('multiDevice')}
      aria-expanded="false"
      aria-controls="multiDevice"
    >
      <Laptop />
      {#if $showSideNav}
        <span class={`p-1 ${getSyncStatus($rtcPeers)}`}>
          <Phone />&nbsp; Devices
        </span>
      {/if}
    </li>
    <!-- <li
      class="nav-item p-1 ms-1"
      type="button"
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      on:click={toggleSettingDialog('history')}
      aria-expanded="false"
      aria-controls="history"
    >
      <ClockHistory />
      {#if $showSideNav}
        <span class="rounded not-selected p-1"> History </span>
      {/if}
    </li> -->
    <li
      class={`nav-item rounded p-1 ms-1 ${
        $showFreshStart ? 'selected' : 'not-selected'
      }`}
      type="button"
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      on:click={toggleSettingDialog('freshStart')}
      aria-expanded="false"
      aria-controls="freshStart"
    >
      <Trash />
      {#if $showSideNav}
        <span class="p-1"> Fresh Start </span>
      {/if}
    </li>
  </ul>
  <!-- Learn Links -->
  <hr />
  {#if $showSideNav}
    <span class="ms-1 fs-5" type="button" on:click={toggleLearn}>
      {#if showLearnLinks}
        <CaretDown />
      {:else}
        <CaretRight />
      {/if}
      Learn Links
    </span>
    {#if showLearnLinks}
      <ul class="nav nav-pills flex-column mb-auto">
        {#each learnLinks as { link, icon, text }}
          <li class="nav-item p-1 ms-1" type="link">
            <a class="text-white" href={link}>
              {#if icon === 'GitHub'}
                <Github />
              {:else}
                <InfoCircle />
              {/if}
              &nbsp;
              <span>{text}</span>
              &nbsp;
              <BoxArrowUpRight />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  {#if $showSideNav}
    <div class="ms-1 fixed-bottom">
      <div class="fs-6">
        {`Duration: ${Math.trunc($budgetStore.frame / weekInMillis)} weeks`}
      </div>
      <div class="fs-6">{getSprintEndDate($budgetStore)}</div>
    </div>
  {/if}
</div>

<style>
  .selected {
    color: var(--bs-dark);
    background-color: var(--bs-light);
  }
  .not-selected {
    color: var(--bs-light);
    background-color: var(--bs-dark);
  }
  .selected:hover {
    color: var(--bs-light);
    background-color: var(--bs-dark);
  }
  .not-selected:hover {
    color: var(--bs-dark);
    background-color: var(--bs-light);
  }
  a {
    text-decoration: none;
  }
  .fixed-bottom {
    width: fit-content;
  }
</style>
