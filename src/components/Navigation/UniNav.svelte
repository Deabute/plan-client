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
  } from '../../indexDb/viewStoreDb';
  import {
    activitiesColumnName,
    agendaColumnName,
    DAYS_SHORT,
    MONTH_SHORT,
    timelineColumnName,
    weekInMillis,
  } from '../../stores/defaultData';
  import Folder from 'svelte-bootstrap-icons/lib/Folder';
  import Stopwatch from 'svelte-bootstrap-icons/lib/Stopwatch';
  import CalendarEvent from 'svelte-bootstrap-icons/lib/CalendarEvent';
  import List from 'svelte-bootstrap-icons/lib/List';
  import ListTask from 'svelte-bootstrap-icons/lib/ListTask';
  import ClockHistory from 'svelte-bootstrap-icons/lib/ClockHistory';
  import ArrowDownUp from 'svelte-bootstrap-icons/lib/ArrowDownUp';
  import BoxArrowUpRight from 'svelte-bootstrap-icons/lib/BoxArrowUpRight';
  import WifiOff from 'svelte-bootstrap-icons/lib/WifiOff';
  import Github from 'svelte-bootstrap-icons/lib/Github';
  import InfoCircle from 'svelte-bootstrap-icons/lib/InfoCircle';
  import People from 'svelte-bootstrap-icons/lib/People';
  import Trash from 'svelte-bootstrap-icons/lib/Trash';
  import Cloud from 'svelte-bootstrap-icons/lib/Cloud';
  import CloudArrowUp from 'svelte-bootstrap-icons/lib/CloudArrowUp';
  import HourglassSplit from 'svelte-bootstrap-icons/lib/HourglassSplit';
  import { toggleSettingDialog } from '../../stores/settingsStore';
  import {
    peerSyncEnabled,
    rtcPeers,
    syncingDown,
    syncingUp,
  } from '../../stores/peerStore';
  import type { peersI } from '../../connections/connectInterface';
  import { connectionStatus, syncStatus } from '../../stores/statusStore';
  import { get12Hour } from '../time/timeConvert';
  import { budgetStore } from '../../stores/budgetStore';
  import type { budgetI } from '../../shared/interface';

  export let mobile: boolean = false;
  export let offcanvas: boolean = false;

  const getViewClass = (
    mobile: boolean,
    dView: boolean,
    mView: boolean,
  ): string => {
    let ourView = mobile ? mView : dView;
    return ourView ? ' selected' : ' not-selected';
  };

  const toggle = (name: string) => {
    return () => {
      if (mobile) mobileToggle(name)();
      else toggleView(name)();
    };
  };

  const getSyncStatus = (peers: peersI[]): string => {
    // show status of first peer detected as connected
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].connected) {
        return peers[i].sank ? 'text-success' : 'text-warning';
      }
    }
    return '';
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
    {#if $showSideNav}<span class="ps-1">Deabute Plan</span>{/if}
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
          <People />
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
  <hr />
  {#if $showSideNav}<span class="ms-1 fs-5">Views</span>{/if}
  <ul class="nav nav-pills flex-column mb-auto">
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`p-1 nav-item`}
      type="button"
      on:click={toggle('activity')}
    >
      <span
        class={`p-1 border border-dark border rounded${getViewClass(
          mobile,
          $showActivityColumn,
          $showActivityMobile,
        )}`}
      >
        <Folder />
      </span>
      {#if $showSideNav}
        <span class="not-selected rounded">
          {activitiesColumnName}
        </span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`p-1 nav-item`}
      type="button"
      on:click={toggle('timeline')}
    >
      <span
        class={`p-1 border border-dark border rounded${getViewClass(
          mobile,
          $showTimelineColumn,
          $showTimelineMobile,
        )}`}
      >
        <Stopwatch />
      </span>
      {#if $showSideNav}
        <span class="not-selected rounded">
          {timelineColumnName}
        </span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class={`p-1 nav-item`}
      type="button"
      on:click={toggle('agenda')}
    >
      <span
        class={`p-1 border border-dark border rounded${getViewClass(
          mobile,
          $showAgendaColumn,
          $showAgendaMobile,
        )}`}
      >
        <CalendarEvent />
      </span>
      {#if $showSideNav}
        <span class="not-selected rounded">
          {agendaColumnName}
        </span>
      {/if}
    </li>
    <li
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      class="nav-item p-1"
      type="button"
      on:click={toggleView('topChild')}
    >
      <span
        class={`p-1 border border-dark border rounded${
          $showTopChild ? ' selected' : ' not-selected'
        }`}
      >
        <ListTask />
      </span>
      {#if $showSideNav}
        <span class="not-selected rounded"> Top sub-folder </span>
      {/if}
    </li>
  </ul>
  <hr />
  {#if $showSideNav}<span class="ms-1 fs-5">Settings</span>{/if}
  <ul class="nav nav-pills flex-column mb-auto">
    <li
      class={`nav-item p-1 ms-1 ${getSyncStatus($rtcPeers)}`}
      type="button"
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      on:click={toggleSettingDialog('peerSync')}
      aria-expanded="false"
      aria-controls="peerSyncDialog"
    >
      <People />
      {#if $showSideNav}
        <span class={`rounded not-selected p-1 ${getSyncStatus($rtcPeers)}`}>
          Peer Sync
        </span>
      {/if}
    </li>
    <li
      class={`nav-item p-1 ms-1${
        $syncingUp || $syncingDown ? ' text-warning' : ''
      }`}
      type="button"
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      on:click={toggleSettingDialog('cloudSync')}
      aria-expanded="false"
      aria-controls="freshStart"
    >
      <Cloud />
      {#if $showSideNav}
        <span class={`rounded not-selected p-1`}> Cloud Sync </span>
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
      class="nav-item p-1 ms-1"
      type="button"
      data-bs-toggle={offcanvas ? 'offcanvas' : ''}
      data-bs-target={offcanvas ? '#mobileMenu' : ''}
      on:click={toggleSettingDialog('freshStart')}
      aria-expanded="false"
      aria-controls="freshStart"
    >
      <Trash />
      {#if $showSideNav}
        <span class="rounded not-selected p-1"> Fresh Start </span>
      {/if}
    </li>
  </ul>
  <hr />
  {#if $showSideNav}<span class="ms-1 fs-5">About</span>{/if}
  <ul class="nav nav-pills flex-column mb-auto">
    <li class="nav-item p-1 ms-1" type="link">
      <a class="text-white" href="https://github.com/Deabute/plan-client">
        <Github />
        {#if $showSideNav}
          &nbsp;
          <span>Github</span>
          &nbsp;
          <BoxArrowUpRight />
        {/if}
      </a>
    </li>
    <li class="nav-item p-1 ms-1" type="link">
      <a class="text-white" href="https://deabute.com/products/plan/">
        <InfoCircle />
        {#if $showSideNav}
          &nbsp;
          <span>Budgeting</span>
          &nbsp;
          <BoxArrowUpRight />
        {/if}
      </a>
    </li>
  </ul>

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
