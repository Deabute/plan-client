<!-- RatingLedgend.svelt Copyright 2021 Paul Beaudet MIT Licence -->
<script lang="ts">
  import { fibonacciScale } from '../stores/defaultData';
  // import { showRatingLegend } from '../stores/settingsStore';
</script>

{#if false}
  <table class="table">
    <thead>
      <tr>
        <th scope="col">Ratings</th>
        <th scope="col">Multiplier</th>
        <th scope="col">Implementation</th>
        <th scope="col">Meaning</th>
        <th scope="col">Recomendation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">0</th>
        <td>{`${fibonacciScale[0]}x`}</td>
        <td>Known</td>
        <td>Will not do</td>
        <td>Use as a note</td>
      </tr>
      <tr>
        <th scope="row">1</th>
        <td>{`${fibonacciScale[1]}x`}</td>
        <td>Known Time</td>
        <td>Very Easy</td>
        <td>Use for fast tasks</td>
      </tr>
      <tr>
        <th scope="row">2</th>
        <td>{`${fibonacciScale[2]}x`}</td>
        <td>Known Easy</td>
        <td>Easy</td>
        <td>Likely a good default</td>
      </tr>
      <tr>
        <th scope="row">3</th>
        <td>{`${fibonacciScale[3]}x`}</td>
        <td>Known Moderate</td>
        <td>Moderate</td>
        <td>Only incremental step</td>
      </tr>
      <tr>
        <th scope="row">4</th>
        <td>{`${fibonacciScale[4]}x`}</td>
        <td>Known Tough</td>
        <td>Takes some work</td>
        <td>Time challenge</td>
      </tr>
      <tr>
        <th scope="row">5</th>
        <td>{`${fibonacciScale[5]}x`}</td>
        <td>Known Unknowns</td>
        <td>Diffucult but approachable</td>
        <td>Consider sub-task</td>
      </tr>
      <tr>
        <th scope="row">6</th>
        <td>{`${fibonacciScale[6]}x`}</td>
        <td>Known Unknowns</td>
        <td>When not sure if hard or easy</td>
        <td>Consider sub-task</td>
      </tr>
      <tr>
        <th scope="row">7</th>
        <td>{`${fibonacciScale[7]}x`}</td>
        <td>Unknown Unknowns</td>
        <td>Not sure how hard</td>
        <td>Break-down to sub-task</td>
      </tr>
      <tr>
        <th scope="row">8</th>
        <td>{`${fibonacciScale[8]}x`}</td>
        <td>Unknown Unknowns</td>
        <td>Here be Dragons</td>
        <td>Break-down to sub-task</td>
      </tr>
      <tr>
        <th scope="row">9</th>
        <td>{`${fibonacciScale[9]}x`}</td>
        <td>¯\_(ツ)_/¯</td>
        <td>Might be impossible</td>
        <td>Use as a note</td>
      </tr>
    </tbody>
  </table>
{/if}

<style>
</style>
