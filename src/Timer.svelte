<script>
  import { createEventDispatcher } from "svelte";
  import { timer, elapsed } from "./timer.js";
  export let currentKeyframe = 0;
  export let keyframeCount = 0;
  export let duration = 1000;
  export let isEnabled = false;

  const dispatch = createEventDispatcher();

  const onReset = () => {
    currentKeyframe = 0;
    timer.reset();
  };

  $: if (isEnabled) currentKeyframe = Math.floor($elapsed / duration);

  $: if (currentKeyframe === keyframeCount) dispatch("end");

  $: isEnabled ? timer.start() : timer.stop();
</script>

<div>

  <button on:click="{onReset}">Replay</button>
</div>

<style>
  div {
    display: flex;
    justify-content: center;
    margin-bottom: 3em;
    position: relative; /* set the position to relative */
    top: 510px; /* move the element 50 pixels down from its normal position */
    left: 350px; /* move the element 100 pixels to the right from its normal position */
  }

  button {
    margin: 0.5em;
    padding: 0.5em;
    border: none;
    background: white;
    font-size: 14px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    color: black;
    border-color: black;
    border-style: solid;
    border-width: thin

  }
  button:hover {
    background-color: #aaa; /* Change to the desired color on hover */
  }
</style>
