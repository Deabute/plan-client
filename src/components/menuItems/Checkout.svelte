<!-- Checkout Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { updateProfile } from '../../indexDb/profilesDb';
  import type { prices } from '../../shared/interface';
  import {
    authProfile,
    priceOptions,
    stripe,
  } from '../../stores/credentialStore';

  export let paymentInProg: boolean = false;

  let email: string = '';
  let selectedProduct: prices = null;
  let validMail: boolean = false;
  let cardElement;
  let stripeReady: boolean = false;
  let mounted: boolean = false;
  let validPaymentInfo: boolean = false;
  let paymentError: string = '';
  // let name: string = '';
  $: validMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      String(email).toLowerCase(),
    );

  if ($priceOptions.length) {
    selectedProduct = $priceOptions[0];
  } else {
    wsSend('catalog');
    wsOn('catalog', ({ data }) => {
      $priceOptions = data;
      if ($priceOptions.length) {
        selectedProduct = $priceOptions[0];
      }
    });
  }

  const loadStripeElements = () => {
    if (!$stripe) stripe.set(Stripe(process.env.STRIPE_PUBLISHABLE_KEY));
    cardElement = $stripe.elements().create('card');
    cardElement.on('change', ({ error, empty }) => {
      validPaymentInfo = !error && !empty && validMail ? true : false;
      paymentError = error ? error.message : '';
    });
    cardElement.mount('#card-element');
  };

  $: validPaymentInfo = paymentInProg ? false : validPaymentInfo;

  const stripeLoaded = () => {
    stripeReady = true;
    if (mounted) loadStripeElements();
  };
  wsOn('subscribe', async ({ id, secret }) => {
    if (secret) {
      const result = await $stripe.confirmCardPayment(secret, {
        receipt_email: email,
        payment_method: {
          card: cardElement,
          // billing_details: { name },
        },
      });
      if (result.error) {
        paymentError = result.error.message;
      } else {
        setTimeout(() => {
          wsSend('requestAuthToken', {
            userId: $authProfile.id,
            password: $authProfile.password,
          });
        }, 3000);
        $authProfile = await updateProfile({
          ...$authProfile,
          assumedAuthTTL: 1,
        });
      }
      paymentInProg = false;
    }
  });

  const subscribe = async () => {
    // hold subscription mode until user is created and card is used
    paymentInProg = true;
    // TODO: prove that this is cert you have the key for
    wsSend('signUp', {
      id: $authProfile.id,
      product: selectedProduct ? selectedProduct.id : null,
      userCert: $authProfile.cert,
      password: $authProfile.password,
      email,
    });
  };

  if ($stripe) stripeReady = true;
  onMount(() => {
    mounted = true;
    if (stripeReady) loadStripeElements();
  });

  const getPrice = (price: prices): string => {
    return `${price.product.name}: $${price.unit_amount / 100}`;
  };
</script>

<svelte:head>
  {#if !$stripe}
    <script src="https://js.stripe.com/v3/" on:load={stripeLoaded}></script>
  {/if}
</svelte:head>

<div class="row">
  <div class="col-md-4">
    <label for="email" class="form-label">Email</label>
    <input
      type="text"
      class="form-control"
      id="email"
      placeholder="Email"
      bind:value={email}
      aria-describedby="get-service-button"
      aria-label="Email"
    />
  </div>
  <!-- <div class="col-md-4">
      <label for="full-name" class="form-label"> Card Holder Name </label>
      <input
        type="text"
        class="form-control"
        id="full-name"
        placeholder="Full Name"
        bind:value={name}
        aria-describedby="sub-button"
        aria-label="Full Name of card holder"
      />
    </div> -->
  <div class="col-md-4">
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
  <div class="col-12 p-3 border gy-2" id="card-element" />
  {#if paymentError}
    <div class="col-12 gy-2">{paymentError}</div>
  {/if}
  <div class="row gy-2">
    {#if paymentInProg}
      <span>Please wait while your payment processes</span>
    {:else}
      <button
        type="button"
        disabled={!validPaymentInfo}
        id="get-service-button"
        on:click={subscribe}
        class="m-1 col-auto btn btn-success"
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
</div>
