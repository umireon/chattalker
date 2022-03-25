<script lang="ts">
  import 'three-dots/dist/three-dots.min.css'

  export let playerIsLoading: boolean
  export let playerLanguage: string
  export let playerSrc: string
  export let playerText: string
</script>

<main>
  <p><audio type="audio/mpeg" src={playerSrc} autoplay></audio></p>
  <div style="display: flex; align-items: flex-start;">
    <p style="margin: 0px;">
      <span id="language">{playerLanguage}</span>
      <span id="text">{playerText}</span>
    </p>
    <div class="dot-bricks" style="visibility: {playerIsLoading ? 'visible' : 'hidden'};"></div>
  </div>
</main>

<style>
  .dot-bricks {
    margin: 10px;
  }
</style>