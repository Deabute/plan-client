<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { authProfile } from '../../stores/credentialStore';
  import { subscriptions } from '../../stores/stripeStore';

  let pauseActions: boolean = false;

  if ($subscriptions.length) {
    console.dir($subscriptions);
  } else {
    wsSend('account', {
      type: 'listSubs',
      id: $authProfile.id,
      password: $authProfile.password,
    });
    wsOn('account', ({ type, data }) => {
      if (type === 'listSubs') {
        $subscriptions = data.data;
      } else if (type === 'toggleSub') {
        let i = 0;
        for (i; i < $subscriptions.length; i++) {
          if ($subscriptions[i].id === data.id) break;
        }
        $subscriptions[i].cancel_at_period_end = data.cancel_at_period_end;
        pauseActions = false;
      } else if (type === 'toggleErr') {
        console.log('there was an error toggling the subscription');
      }
    });
  }

  const toggleSub = (subId: string, cancel: boolean) => {
    return () => {
      pauseActions = true;
      wsSend('account', {
        type: 'toggleSub',
        id: $authProfile.id,
        password: $authProfile.password,
        subId,
        cancel_at_period_end: !cancel,
      });
    };
  };
</script>

<table class="table">
  <thead>
    <tr>
      <th scope="col">Plan</th>
      <th scope="col" />
      <th scope="col">Renewal</th>
      <th scope="col">Cost</th>
      <th scope="col">Status</th>
      <th scope="col">Card</th>
    </tr>
  </thead>
  <tbody>
    {#each $subscriptions as { id, status, default_payment_method, current_period_end, cancel_at_period_end, plan }}
      <tr>
        <td>Multi-device</td>
        <td>
          {#if status === 'active' && !pauseActions && current_period_end * 1000 > Date.now()}
            <button
              class={`btn btn-sm btn-${
                cancel_at_period_end ? 'success' : 'danger'
              }`}
              on:click={toggleSub(id, cancel_at_period_end)}
            >
              {cancel_at_period_end ? 'Reactivate' : 'Cancel'}
            </button>
          {/if}
        </td>

        <td>
          {`${cancel_at_period_end ? 'Canceling' : 'Renewing'} ${new Date(
            current_period_end * 1000,
          ).toDateString()}`}
        </td>
        <td>{`$${plan.amount / 100}/${plan.interval}`}</td>
        <td>{status}</td>
        <td>
          {#if status === 'active'}
            {default_payment_method?.card?.last4
              ? default_payment_method.card.last4
              : '????'}
          {/if}
        </td>
      </tr>
    {:else}
      <tr>
        <td>Loading subscriptions...</td>
      </tr>
    {/each}
  </tbody>
</table>
