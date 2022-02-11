<!-- NavItem.svelte Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import type { navItems } from '../../shared/interface';
  import BoxArrowUpRight from 'svelte-bootstrap-icons/lib/BoxArrowUpRight';
  import Icon from './Icon.svelte';
  import { toggleView } from '../../indexDb/viewStoreDb';

  export let item: navItems;
</script>

<li class="nav-item p-1 ms-1" type={item.type}>
  {#if item.type === 'link'}
    <a class="text-white" href={item.link}>
      <Icon name={item.icon} />
      <span>{item.text}</span>
      &nbsp;
      <BoxArrowUpRight />
    </a>
  {:else}
    <span on:click={toggleView(item.link)} type={item.type}>
      <Icon name={item.icon} />
      {item.text}
    </span>
  {/if}
</li>

<style>
  a {
    text-decoration: none;
  }
</style>
