<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { authProfile } from '../../stores/credentialStore';
  import { subscriptions } from '../../stores/stripeStore';

  if ($subscriptions.length) {
    console.dir($subscriptions);
  } else {
    wsSend('account', { id: $authProfile.id, password: $authProfile.password });
    wsOn('account', ({ sub }) => {
      console.dir(sub);
      $subscriptions = sub;
    });
  }
</script>

{#each $subscriptions as { id, status, default_payment_method, current_period_end }}
  <div class="row">
    <h4>
      <a href={`https://dashboard.stripe.com/test/subscriptions/${id}`}>
        {id}
      </a>
    </h4>
    <p>
      Status: {status}
    </p>
    {#if default_payment_method?.card?.last4}
      <p>
        Card last4: {default_payment_method.card.last4}
      </p>
    {:else}
      <small>
        Last digits are blank, ensure webhooks are being handled. The default
        payment method is set in the webhook handler.
      </small>
    {/if}
    <p>
      {`Current period end: ${new Date(current_period_end * 1000)}`}
    </p>
    <!--<a href="change-payment-method.html?subscription=${subscription.id}"> Update payment method </a><br />
    <a href="change-plan.html?subscription=${subscription.id}"> Change plan </a><br /> -->
    <!-- <a href="cancel.html?subscription=${subscription.id}"> Cancel </a><br /> -->
  </div>
{:else}
  <p>Loading subscriptions...</p>
{/each}
