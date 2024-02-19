<script>
  import { getContext } from "svelte";
  import { format } from "d3";

  export let value;
  export let rank;
  export let i;

  const { names, scales, dimensions } = getContext("Chart");
  const formatNumber = (d) => format(",.1f")(d) + "%";

  $: x = $scales.x(value);
  $: y = $scales.y(rank) + $dimensions.barMargin / 2;
  $: height = $dimensions.barHeight;
</script>

<!-- Display names and values beside the bars -->
<div style="position: absolute; top: {y}px; left: {x + 5}px;">

  <p class="name">{names[i]}</p>
  <p class="value">{formatNumber(value)}</p>
</div>

<style>
  p {
    margin: 0;
    font-size: 1em;
  }
  .name {
    font-weight: 600;
  }
  .value {
    font-size: 1em;
    font-feature-settings: "tnum" 1;
    font-weight: 300;
  }
</style>