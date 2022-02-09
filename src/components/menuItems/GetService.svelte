<!-- GetService Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { peerBroadcast } from '../../connections/dataChannels';
  import { wsSend } from '../../connections/WebSocket';
  import { updateProfile } from '../../indexDb/profilesDb';
  import type { profileI, tokenI } from '../../shared/interface';
  import { statusMsgs } from '../../stores/defaultData';

  export let recentToken: tokenI;
  export let profile: profileI;
  export let status: string;

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

  const connect = async () => {
    wsSend('login', {
      email,
      password,
    });
  };

  const signUpOrConnect = async () => {
    if (!profile) {
      status = 'No profile set (Not authorized to sync)';
      return;
    }
    if (!inviteMode) {
      connect();
      return;
    }
    status = statusMsgs.interest;
    submitedInterest = true;
    profile.assumedAuthTTL = 1;
    const { id, cert, password } = profile;
    // TODO: prove that this is cert you have the key for
    wsSend('interestedSignUp', {
      id,
      userCert: cert,
      password,
      email,
    });
    const newProfile = await updateProfile(profile);
    peerBroadcast('sync-profiles', { data: newProfile, done: true });
  };

  const onProfileChange = (newProfile: profileI) => {
    if (newProfile.assumedAuthTTL < 1) {
      status = statusMsgs.noAuth;
    }
    if (newProfile.assumedAuthTTL === 1) {
      status = statusMsgs.interest;
    }
    if (newProfile.assumedAuthTTL > 0) {
      submitedInterest = true;
      dismissedAlert = true;
    }
  };

  $: onProfileChange(profile);
</script>

{#if recentToken && profile}
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
      {showPassword ? profile.password : '**********'}
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
{#if !submitedInterest && profile}
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
