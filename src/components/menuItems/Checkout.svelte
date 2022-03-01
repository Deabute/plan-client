<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { updateProfile } from '../../indexDb/profilesDb';
  import type { prices } from '../../shared/interface';
  import { authProfile } from '../../stores/credentialStore';
  import { stripe, priceOptions } from '../../stores/stripeStore';

  export let loading: boolean = true;

  let email: string = '';
  let selectedProduct: prices = null;
  let validMail: boolean = false;
  let paymentElement;
  let validPaymentInfo: boolean = false;
  let paymentError: string = '';
  let elements;
  let needStripe: boolean = false;
  let checkout: boolean = false;

  $: validMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      String(email).toLowerCase(),
    );

  if ($priceOptions.length) {
    selectedProduct = $priceOptions[0];
  } else {
    wsSend('catalog');
    wsOn('catalog', ({ data }) => {
      loading = false;
      $priceOptions = data;
      if ($priceOptions.length) {
        selectedProduct = $priceOptions[0];
      }
    });
  }

  const subscriptionCheckout = () => {
    needStripe = true;
    wsSend('createSub', {
      email,
      selectedProduct: selectedProduct.id,
      userId: $authProfile.id,
      userCert: $authProfile.cert,
      password: $authProfile.password,
    });
    wsOn('createSub', ({ clientSecret }) => {
      const waitForStripe = $stripe ? 0 : 1000;
      const setUpCardElement = () => {
        setTimeout(() => {
          if (!$stripe) setUpCardElement();
          elements = $stripe.elements({ clientSecret });
          paymentElement = elements.create('payment');
          paymentElement.on('change', ({ error, complete, collapsed }) => {
            if (!checkout && !collapsed) checkout = true;
            validPaymentInfo = !error && complete;
            paymentError = error ? error.message : '';
          });
          paymentElement.mount('#payment-element');
        }, waitForStripe);
      };
      setUpCardElement();
    });
  };

  const stripeLoaded = () => {
    if (!$stripe) $stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
  };

  const subscribe = async () => {
    loading = true;
    await updateProfile({
      ...$authProfile,
      assumedAuthTTL: 1,
    });
    const { error } = await $stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });
    if (error) {
      paymentError = error.message;
      await updateProfile({
        ...$authProfile,
        assumedAuthTTL: 0,
      });
      loading = false;
    }
  };

  const getPrice = (price: prices): string => {
    return `${price.product.name}: $${price.unit_amount / 100}`;
  };
</script>

<svelte:head>
  {#if !$stripe && needStripe}
    <script src="https://js.stripe.com/v3/" on:load={stripeLoaded}></script>
  {/if}
</svelte:head>

{#if !checkout}
  <div class="alert alert-success">Sign up for multi device access today!</div>
  <div class="row">
    <div class="col-md-4">
      <label for="email" class="form-label">Email</label>
      <input
        type="text"
        class="form-control"
        id="email"
        placeholder="Email"
        bind:value={email}
        aria-label="Email"
      />
    </div>
    <div class="col-6">
      <label for="selectProduct" class="form-label">Service</label>
      <select
        class="form-select"
        name="product"
        id="selectProduct"
        bind:value={selectedProduct}
      >
        {#each $priceOptions as price}
          <option value={price}>{getPrice(price)}</option>
        {:else}
          <option value="">No products available</option>
        {/each}
      </select>
    </div>
    <button
      type="button"
      disabled={!$priceOptions.length ||
        !validMail ||
        loading ||
        !selectedProduct}
      class="btn btn-success col-2"
      on:click={subscriptionCheckout}
    >
      Checkout
    </button>
  </div>
{/if}

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
<div class="row gy-2">
  <div class="col-12 gy-2" id="payment-element" />
  {#if checkout}
    <button
      type="button"
      disabled={loading || !validPaymentInfo}
      id="get-service-button"
      on:click={subscribe}
      class="m-1 col-12 btn btn-success"
    >
      {`Subscribe${
        selectedProduct
          ? ` $${selectedProduct.unit_amount / 100} a ${
              selectedProduct.recurring.interval
            }`
          : ' (No product selected)'
      }`}
    </button>
  {/if}
</div>
