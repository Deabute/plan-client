<!-- GetService Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsSend } from '../../connections/WebSocket';
  import { authProfile, authToken } from '../../stores/credentialStore';
  import Account from './Account.svelte';
  import Checkout from './Checkout.svelte';

  let loginMode: boolean = false;
  let paymentInProg: boolean = false;
  let password: string = '';
  let showPassword: boolean = false;
  let email: string = '';
  let postPayment: boolean = false;
  let validMail: boolean = false;
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
</script>

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
  <Account />
{/if}
{#if !postPayment && $authProfile}
  <div class="row">
    <Checkout bind:paymentInProg />
    <hr />
    <div class="row mt-1">
      <button
        type="button"
        disabled={paymentInProg}
        id="login-toggle"
        on:click={() => {
          loginMode = !loginMode;
        }}
        class="col-auto btn btn-info"
      >
        {loginMode ? 'Hide' : 'Or Login'}
      </button>
      {#if loginMode}
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
        <div class="col-md-4">
          <label for="login-password" class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            id="login-password"
            placeholder="Password"
            bind:value={password}
            aria-describedby="get-service-button"
            aria-label="Password that will be shown on other device"
          />
        </div>
        {#if paymentInProg}
          <span>Please wait while your payment processes</span>
        {:else}
          <button
            type="button"
            disabled={!validMail}
            id="get-service-button"
            on:click={login}
            class="col-auto btn btn-success"
          >
            Login
          </button>
        {/if}
      {/if}
    </div>
  </div>
{/if}
