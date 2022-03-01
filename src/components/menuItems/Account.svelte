<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import type { stripePaymentMethod } from '../../shared/interface';
  import { authProfile } from '../../stores/credentialStore';
  import {
    paymentMethods,
    stripe,
    subscriptions,
  } from '../../stores/stripeStore';

  let defaultCard: string = '';
  let needStripe: boolean = false;
  let paymentElement;
  let elements;
  let payElReady: boolean = false;
  let validPaymentInfo: boolean = false;
  let paymentError: string = '';
  let loading: boolean = true;
  let ableToRemoveOnlyPm: boolean = false;

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
        defaultCard = data.defaultPm;
        ableToRemoveOnlyPm =
          $subscriptions.length === 1 && $subscriptions[0].cancel_at_period_end
            ? true
            : false;
      } else if (type === 'toggleSub') {
        ableToRemoveOnlyPm =
          $subscriptions.length === 1 && data.cancel_at_period_end
            ? true
            : false;
        let i = 0;
        for (i; i < $subscriptions.length; i++) {
          if ($subscriptions[i].id === data.id) break;
        }
        $subscriptions[i].cancel_at_period_end = data.cancel_at_period_end;
      } else if (type === 'toggleErr') {
        paymentError = 'There was an error changing the payment method';
      } else if (type === 'addPaymentMethod') {
        const waitForStripe = $stripe ? 0 : 1000;
        const setUpCardElement = () => {
          setTimeout(() => {
            if (!$stripe) setUpCardElement();
            elements = $stripe.elements({ clientSecret: data.client_secret });
            paymentElement = elements.create('payment');
            paymentElement.on('change', ({ error, complete, collapsed }) => {
              if (!payElReady && !collapsed) payElReady = true;
              validPaymentInfo = !error && complete;
              paymentError = error ? error.message : '';
            });
            paymentElement.mount('#pay-element');
          }, waitForStripe);
        };
        setUpCardElement();
      } else if (type === 'deletePaymentMethod') {
        $paymentMethods = $paymentMethods.filter((pm) => pm.id !== data.id);
      } else if (type === 'toggleDefaultPayment') {
        if (data?.default) {
          defaultCard = data.default;
        } else {
          paymentError = 'failed to change payment method';
        }
      }
      loading = false;
    });
  }

  const toggleSub = (subId: string, cancel: boolean) => {
    return () => {
      loading = true;
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
    needStripe = true;
    wsSend('account', {
      type: 'addPaymentMethod',
      id: $authProfile.id,
      password: $authProfile.password,
    });
  };

  const confirmNewMethod = async () => {
    if (!$stripe) return;
    loading = true;
    const { error } = await $stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });
    if (error) paymentError = error.message;
    loading = false;
  };

  const stripeLoaded = () => {
    if (!$stripe) stripe.set(Stripe(process.env.STRIPE_PUBLISHABLE_KEY));
  };

  const rmPaymentMethod = (id: string) => {
    return () => {
      loading = true;
      wsSend('account', {
        type: 'deletePaymentMethod',
        id: $authProfile.id,
        password: $authProfile.password,
        paymentMethodId: id,
      });
    };
  };

  const toggleDefaultPayment = (id: string) => {
    return () => {
      defaultCard = '';
      setTimeout(() => {
        defaultCard = id;
      }, 0);
      if (defaultCard === id) return;
      loading = true;
      wsSend('account', {
        type: 'toggleDefaultPayment',
        id: $authProfile.id,
        password: $authProfile.password,
        default_payment_method: id,
      });
    };
  };

  const isRmDisabled = (
    id: string,
    defaultPm: string,
    loadStatus: boolean,
    rmLast: boolean,
    pmArray: stripePaymentMethod[],
  ): boolean => {
    if (id === defaultPm) {
      return rmLast && pmArray.length === 1 ? false : true;
    }
    if (loadStatus) return true;
    return false;
  };
</script>

<svelte:head>
  {#if !$stripe && needStripe}
    <script src="https://js.stripe.com/v3/" on:load={stripeLoaded}></script>
  {/if}
</svelte:head>

<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol
    id="exclamation-triangle-fill"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path
      d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
    />
  </symbol>
</svg>

{#if paymentError}
  <div class="alert alert-danger alert-dismissible" role="alert">
    <svg
      class="bi flex-shrink-0 me-2"
      width="24"
      height="24"
      role="img"
      aria-label="Danger:"
      ><use xlink:href="#exclamation-triangle-fill" />
    </svg>
    {paymentError}
    <button
      type="button"
      class="btn-close"
      aria-label="Close"
      on:click={() => {
        paymentError = '';
      }}
    />
  </div>
{/if}
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
    {#each $subscriptions as { id, status, current_period_end, cancel_at_period_end, plan }}
      <tr>
        <td>Multi-device</td>
        <td>
          {#if status === 'active' && current_period_end * 1000 > Date.now() && $paymentMethods.length}
            <button
              class={`btn btn-sm btn-${
                cancel_at_period_end ? 'success' : 'danger'
              }`}
              on:click={toggleSub(id, cancel_at_period_end)}
              disabled={loading}
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
              disabled={defaultCard === id}
              on:change={toggleDefaultPayment(id)}
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
            disabled={isRmDisabled(
              id,
              defaultCard,
              loading,
              ableToRemoveOnlyPm,
              $paymentMethods,
            )}
            on:click={rmPaymentMethod(id)}
          >
            Remove
          </button>
        </td>
      </tr>
    {/each}
    {#if !needStripe}
      <tr>
        <td> New Card </td>
        <td />
        <td />
        <td>
          <button
            type="button"
            class="btn btn-sm btn-success"
            on:click={addPaymentMethod}
            disabled={loading}
          >
            Add
          </button>
        </td>
      </tr>
    {/if}
  </tbody>
</table>
<div id="pay-element" />
{#if payElReady}
  <button
    type="button"
    class="btn btn-sm btn-success"
    on:click={confirmNewMethod}
    disabled={!validPaymentInfo || loading}
  >
    Add Payment Method
  </button>
{/if}
