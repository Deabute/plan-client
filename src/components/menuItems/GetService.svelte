<!-- GetService Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsSend } from '../../connections/WebSocket';
  import { authProfile, authToken } from '../../stores/credentialStore';
  import Account from './Account.svelte';
  import Checkout from './Checkout.svelte';

  let loginMode: boolean = false;
  let loading: boolean = true;
  let password: string = '';
  let showPassword: boolean = false;
  let email: string = '';
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
</script>

{#if $authProfile.assumedAuthTTL === 1 && !loading}
  <div class="alert alert-warning">
    ... Waiting for subscription order to clear. Reloading after some time page
    may help. If this message persist please contact paul@deaubute.com
  </div>
{/if}
{#if $authProfile.assumedAuthTTL > 1 && $authProfile.password}
  <div class="alert alert-success">
    Thanks for subscribing, below is your account information to set up another
    device, or change payment method.
  </div>
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
{#if !$authToken.token && $authProfile.id && $authProfile.password && $authProfile.assumedAuthTTL === 0}
  <Checkout bind:loading />
  <hr />
  <div class="row mt-1">
    <button
      type="button"
      disabled={loading}
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
      <button
        type="button"
        disabled={!validMail || loading}
        id="get-service-button"
        on:click={login}
        class="col-auto btn btn-success"
      >
        Login
      </button>
    {/if}
  </div>
{/if}
