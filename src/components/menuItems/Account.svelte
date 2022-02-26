<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { authProfile } from '../../stores/credentialStore';
  import { subscriptions } from '../../stores/stripeStore';

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
      } else if (type === 'cancelSub') {
        let i = 0;
        for (i; i < $subscriptions.length; i++) {
          if ($subscriptions[i].id === data.id) break;
        }
        $subscriptions[i] = data;
      } else if (type === 'cancelErr') {
        console.log('there was an error cancelling the subscription');
      }
    });
  }

  const cancelSub = (subId: string) => {
    return () => {
      wsSend('account', {
        type: 'cancelSub',
        id: $authProfile.id,
        password: $authProfile.password,
        subId,
      });
    };
  };
</script>

<table class="table">
  <thead>
    <tr>
      <th scope="col">Plan</th>
      <th scope="col">Card</th>
      <th scope="col">Action</th>
      <th scope="col">Status</th>
      <th scope="col">Cost</th>
      <th scope="col">End Time</th>
    </tr>
  </thead>
  <tbody>
    {#each $subscriptions as { id, status, default_payment_method, current_period_end, plan }}
      <tr>
        <td>Multi-device</td>
        <td>
          {#if status === 'active'}
            {default_payment_method?.card?.last4
              ? default_payment_method.card.last4
              : '????'}
          {/if}
        </td>
        <td>
          {#if status === 'active'}
            <button class="btn btn-danger" on:click={cancelSub(id)}>
              Cancel
            </button>
          {/if}
        </td>
        <td>{status}</td>
        <td>{`$${plan.amount / 100}/${plan.interval}`}</td>
        <td>{new Date(current_period_end * 1000).toDateString()}</td>
      </tr>
    {:else}
      <tr>
        <td>Loading subscriptions...</td>
      </tr>
    {/each}
  </tbody>
</table>
