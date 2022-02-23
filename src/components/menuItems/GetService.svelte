<!-- GetService Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { onMount } from 'svelte';

  import { wsOn, wsSend } from '../../connections/WebSocket';
  import { updateProfile } from '../../indexDb/profilesDb';
  import type { prices, profileI } from '../../shared/interface';
  import {
    authProfile,
    authToken,
    priceOptions,
  } from '../../stores/credentialStore';

  let loginMode: boolean = false;
  let paymentInProg: boolean = false;
  let password: string = '';
  let showPassword: boolean = false;
  let email: string = '';
  let selectedProduct: prices = null;
  let postPayment: boolean = false;
  let validMail: boolean = false;
  let stripe;
  let cardElement;
  let stripeReady: boolean = false;
  let mounted: boolean = false;
  let name: string = '';
  $: validMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      String(email).toLowerCase(),
    );

  const login = async () => {
    wsSend('login', {
      email,
      password,
    });
  };

  authProfile.subscribe((profile) => {
    if (profile.assumedAuthTTL > 0 && !paymentInProg) postPayment = true;
  });

  const mountCard = (post: boolean, auth: profileI, prices: prices[]) => {
    if (!post && auth && prices.length) cardElement.mount('#card-element');
  };
  $: mountCard(postPayment, $authProfile, $priceOptions);

  if (!$priceOptions.length) wsSend('catalog');
  wsOn('catalog', ({ data }) => {
    $priceOptions = data;
    if ($priceOptions.length) {
      selectedProduct = $priceOptions[0];
    }
  });

  const loadStripeElements = () => {
    stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);
    cardElement = stripe.elements().create('card');
  };

  const stripeLoaded = () => {
    stripeReady = true;
    if (mounted) loadStripeElements();
  };
  wsOn('subscribe', async ({ id, secret }) => {
    if (secret) {
      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: { name },
        },
      });
      if (result.error) {
        console.error(result.error.message);
      } else {
        console.log('subscription success');
        // this is the part where a token should be requseted again
      }
      paymentInProg = false;
      $authProfile = await updateProfile({
        ...$authProfile,
        assumedAuthTTL: 1,
      });
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

  onMount(() => {
    mounted = true;
    if (stripeReady) loadStripeElements();
  });

  const getPrice = (price: prices): string => {
    return `${price.product.name} ${price.unit_amount / 100} ${
      price.currency
    }/${price.recurring.interval}`;
  };
</script>

<svelte:head>
  <script src="https://js.stripe.com/v3/" on:load={stripeLoaded}></script>
</svelte:head>

{#if $authToken.token && $authProfile}
  <div class="row my-2">
    <buton
      class="btn btn-info m-1 col-2"
      on:click={() => {
        showPassword = !showPassword;
      }}
    >
      {`${showPassword ? 'Hide' : 'Show'} password for login`}
    </buton>
    <span class="col-8 fs-3 text-center">
      {showPassword ? $authProfile.password : '**********'}
    </span>
  </div>
{/if}
{#if !postPayment && $authProfile}
  <div class="row mb-1">
    <div class="form-floating mb3 gy-2">
      <input
        type="text"
        class="form-control"
        id="email"
        placeholder="Email"
        bind:value={email}
        aria-describedby="get-service-button"
        aria-label="Email"
      />
      <label for="email">Email</label>
    </div>
    {#if loginMode}
      <div class="form-floating mb3 gy-2">
        <input
          type="password"
          class="form-control"
          id="login-password"
          placeholder="Password"
          bind:value={password}
          aria-describedby="get-service-button"
          aria-label="Password that will be shown on other device"
        />
        <label for="login-password">Password</label>
      </div>
    {:else}
      <select
        class="form-select m-1"
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
      <div class="form-floating mb-1 gy-2">
        <input
          type="text"
          class="form-control"
          id="full-name"
          placeholder="Full Name"
          bind:value={name}
          aria-describedby="sub-button"
          aria-label="Full Name of card holder"
        />
        <label for="full-name"> Card Holder Name </label>
      </div>
      <div id="card-element" />
    {/if}
    <div class="row mt-1">
      <button
        type="button"
        disabled={!validMail}
        id="get-service-button"
        on:click={loginMode ? login : subscribe}
        class={`m-1 col-auto btn btn-${validMail ? 'success' : 'secondary'}`}
      >
        {loginMode ? 'Log-in' : 'Subscribe'}
      </button>
      {#if paymentInProg}
        <span>Please wait while your payment processes</span>
      {:else}
        <button
          type="button"
          id="switch-to-invite-mode"
          on:click={() => {
            loginMode = !loginMode;
          }}
          class="col-auto btn btn-info m-1"
        >
          {loginMode ? 'Switch to Log-in' : 'Switch to Sign-up'}
        </button>
      {/if}
    </div>
  </div>
{/if}
