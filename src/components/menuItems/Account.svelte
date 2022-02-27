<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { authProfile } from '../../stores/credentialStore';
  import {
    paymentMethods,
    stripe,
    subscriptions,
  } from '../../stores/stripeStore';

  let pauseActions: boolean = false;
  let defaultCard: string = '';
  let needStripe: boolean = false;
  let paymentElement;
  let elements;
  let payElReady: boolean = false;
  let validPaymentInfo: boolean = false;
  let paymentError: string = '';
  let additionInProcess: boolean = false;
  let confirmInProcess: boolean = false;

  if ($subscriptions.length) {
    console.dir($subscriptions);
  } else {
    wsSend('account', {
      type: 'listAccountDetails',
      id: $authProfile.id,
      password: $authProfile.password,
    });
    wsOn('account', ({ type, data }) => {
      if (type === 'listAccountDetails') {
        $subscriptions = data.subs.data;
        $paymentMethods = data.payments.data;
        defaultCard = data.subs.data.length
          ? data.subs.data[0].default_payment_method
          : '';
      } else if (type === 'toggleSub') {
        let i = 0;
        for (i; i < $subscriptions.length; i++) {
          if ($subscriptions[i].id === data.id) break;
        }
        $subscriptions[i].cancel_at_period_end = data.cancel_at_period_end;
        pauseActions = false;
      } else if (type === 'toggleErr') {
        console.log('there was an error toggling the subscription');
      } else if (type === 'addPaymentMethod') {
        const waitForStripe = $stripe ? 0 : 1000;
        payElReady = true;
        const setUpCardElement = () => {
          setTimeout(() => {
            if (!$stripe) setUpCardElement();
            elements = $stripe.elements({ clientSecret: data.client_secret });
            paymentElement = elements.create('payment');
            paymentElement.on('change', ({ error, empty }) => {
              validPaymentInfo = !error && !empty;
              paymentError = error ? error.message : '';
            });
            paymentElement.mount('#pay-element');
          }, waitForStripe);
        };
        setUpCardElement();
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

  const addPaymentMethod = () => {
    additionInProcess = true;
    needStripe = true;
    wsSend('account', {
      type: 'addPaymentMethod',
      id: $authProfile.id,
      password: $authProfile.password,
    });
  };

  const confirmNewMethod = async () => {
    if (!$stripe) return;
    confirmInProcess = true;
    const { errors } = await $stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });
    console.log(errors ? errors : 'success');
    confirmInProcess = false;
  };

  const stripeLoaded = () => {
    if (!$stripe) stripe.set(Stripe(process.env.STRIPE_PUBLISHABLE_KEY));
  };

  const rmPaymentMethod = () => {
    console.log('remove payment method');
  };
</script>

<svelte:head>
  {#if !$stripe && needStripe}
    <script src="https://js.stripe.com/v3/" on:load={stripeLoaded}></script>
  {/if}
</svelte:head>

<table class="table">
  <thead>
    <tr>
      <th scope="col">Plan</th>
      <th scope="col"> Change </th>
      <th scope="col">Renewal</th>
      <th scope="col">Cost</th>
      <th scope="col">Status</th>
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
          {:else if pauseActions}
            loading...
          {/if}
        </td>

        <td>
          {`${cancel_at_period_end ? 'Canceling' : 'Renewing'} ${new Date(
            current_period_end * 1000,
          ).toDateString()}`}
        </td>
        <td>{`$${plan.amount / 100}/${plan.interval}`}</td>
        <td>{status}</td>
      </tr>
    {:else}
      <tr>
        <td>Loading subscriptions...</td>
      </tr>
    {/each}
  </tbody>
</table>
<table class="table">
  <thead>
    <tr>
      <th scope="col">Payment Method</th>
      <th scope="col">Last 4 digits</th>
      <th scope="col">Expiration</th>
      <th scope="col">Change</th>
    </tr>
  </thead>
  <tbody>
    {#each $paymentMethods as { id, card }}
      <tr>
        <td>
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              name="defaultPayment"
              id={`defaultPayment${id}`}
              value=""
              checked={defaultCard === id}
              on:change={() => (defaultCard = id)}
            />
            <label class="form-check-label" for={`defaultPayment${id}`}>
              {card.brand}
            </label>
          </div>
        </td>
        <td>{card.last4}</td>
        <td>{`${card.exp_month}/${card.exp_year}`}</td>
        <td>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            on:click={rmPaymentMethod}
          >
            Remove
          </button>
        </td>
      </tr>
    {:else}
      <tr>
        <td>Loading Cards...</td>
      </tr>
    {/each}
    {#if !additionInProcess}
      <tr>
        <td> New Card </td>
        <td />
        <td />
        <td>
          <button
            type="button"
            class="btn btn-sm btn-success"
            on:click={addPaymentMethod}
          >
            Add
          </button>
        </td>
      </tr>
    {/if}
  </tbody>
</table>
{#if payElReady}
  <div id="pay-element" />
  <button
    type="button"
    class="btn btn-sm btn-success"
    on:click={confirmNewMethod}
    disabled={!validPaymentInfo || confirmInProcess}
  >
    Confirm
  </button>
{/if}
