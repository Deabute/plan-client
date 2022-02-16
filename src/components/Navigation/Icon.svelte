<!-- Icon.svelte Copyright 2022 Paul Beaudet MIT Licence -->
<script lang="ts">
  export let name: string;
  import CurrencyDollar from 'svelte-bootstrap-icons/lib/CurrencyDollar';
  import InfoCircle from 'svelte-bootstrap-icons/lib/InfoCircle';
  import Github from 'svelte-bootstrap-icons/lib/Github';
  import Envelope from 'svelte-bootstrap-icons/lib/Envelope';
</script>

{#if name === 'GitHub'}
  <Github />
{:else if name === 'CurrencyDollar'}
  <CurrencyDollar />
{:else if name === 'Envelope'}
  <Envelope />
{:else}
  <InfoCircle />
{/if}
&nbsp;
