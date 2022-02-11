<!-- Donate.svelte Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsSend } from '../../connections/WebSocket';
  import { showDonate, toggleView } from '../../indexDb/viewStoreDb';
  import BoxArrowInLeft from 'svelte-bootstrap-icons/lib/BoxArrowInLeft';

  interface teir {
    name: string;
    id: number;
    priceInCents: number;
  }
  const donationTeirs: teir[] = [
    { name: 'Bronze', id: 1, priceInCents: 500 },
    { name: 'Silver', id: 2, priceInCents: 2000 },
    { name: 'Gold', id: 3, priceInCents: 8000 },
  ];

  const checkout = (id: number) => {
    return () => {
      wsSend('checkout', { id });
    };
  };
</script>

{#if $showDonate}
  <div class="col" id="multiDeviceDialog">
    <div class="card card-body m-3">
      <div class="row my-2">
        <button
          class="col-2 btn btn-danger m-1"
          on:click={toggleView('showDonate')}
          aria-expanded="false"
          aria-controls="donate view"
        >
          <BoxArrowInLeft /> Back
        </button>
        <span class="col-8 fs-1 text-center">Donate</span>
      </div>
      <div class="row mt-2 justify-content-center">
        {#each donationTeirs as { name, id, priceInCents }}
          <button class="btn btn-success m-1 col-auto" on:click={checkout(id)}>
            {`${name} - $${priceInCents / 100}`}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
