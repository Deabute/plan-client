<!-- GetService Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { wsSend } from '../../connections/WebSocket';
  import { updateProfile } from '../../indexDb/profilesDb';
  import { authProfile, authToken } from '../../stores/credentialStore';

  let inviteMode: boolean = true;
  let password: string = '';
  let showPassword: boolean = false;
  let email: string = '';
  let submitedInterest: boolean = false;
  let dismissedAlert: boolean = false;
  let validMail: boolean = false;
  $: validMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      String(email).toLowerCase(),
    );

  const signUpOrConnect = async () => {
    if (!inviteMode) {
      wsSend('login', {
        email,
        password,
      });
      return;
    }
    submitedInterest = true;
    // TODO: prove that this is cert you have the key for
    wsSend('interestedSignUp', {
      id: $authProfile.id,
      userCert: $authProfile.cert,
      password: $authProfile.password,
      email,
    });
    $authProfile = await updateProfile({
      ...$authProfile,
      assumedAuthTTL: 1,
    });
  };

  authProfile.subscribe((profile) => {
    if (profile.assumedAuthTTL > 0) {
      submitedInterest = true;
      dismissedAlert = true;
    }
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
{/if}
{#if submitedInterest && !dismissedAlert}
  <div class="row">
    <div
      class="text-center alert alert-success alert-dismissible fade show"
      role="alert"
    >
      Thanks for your interest
      <button
        on:click={() => {
          dismissedAlert = true;
        }}
        type="button"
        class="btn-close"
        data-bs-dismiss="alert"
        aria-label="close"
      />
    </div>
  </div>
{/if}
{#if !submitedInterest && $authProfile}
  <div class="row mb-1">
    {#if inviteMode}
      <div class="form-floating mb-1 gy-2">
        <input
          type="text"
          class="form-control"
          id="interest-email"
          placeholder="Email"
          bind:value={email}
          aria-describedby="get-service-button"
          aria-label="Email to get invite"
        />
        <label for="interest-email">
          Enter email to express interest in multi-device
        </label>
      </div>
    {:else}
      <div class="form-floating mb3 gy-2">
        <input
          type="text"
          class="form-control"
          id="email-invite"
          placeholder="Email"
          bind:value={email}
          aria-describedby="get-service-button"
          aria-label="Email you signed up with"
        />
        <label for="email-invite">Invited Email</label>
      </div>
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
    {/if}
    <div class="row mt-1">
      <button
        type="button"
        disabled={!validMail}
        id="get-service-button"
        on:click={signUpOrConnect}
        class={`m-1 col-auto btn btn-${validMail ? 'success' : 'secondary'}`}
      >
        {inviteMode ? 'Express interest' : 'Connect'}
      </button>
      <button
        type="button"
        id="switch-to-invite-mode"
        on:click={() => {
          inviteMode = !inviteMode;
        }}
        class="col-auto btn btn-info m-1"
      >
        {inviteMode ? 'Log-in instead' : 'Get Invite instead'}
      </button>
    </div>
  </div>
{/if}
