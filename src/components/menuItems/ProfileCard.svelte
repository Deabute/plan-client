<!-- ProfileCard Copyright 2021 Paul Beaudet MIT License -->
<script lang="ts">
  import type { profileI } from '../../shared/interface';

  export let profile: profileI;
</script>

<div class="card mt-1">
  <div class="card-body row text-center">
    <span class="col-4">{profile.name}</span>
    <span class="col-4">{profile.id}</span>
    <span class="col-4">{profile.status}</span>
  </div>
</div>
