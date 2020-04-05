<script>
  import { onMount } from 'svelte'
  import { toStyleText, colors } from './utils'

  export let fontWidth
  export let lineWidth
  export let lineHeight
  export let paddingTop
  export let paddingLeft
  export let wrapperWidth

  // onMount(() => {
  //   console.log(1)
  // })

  let el
  export let occurrences = []
  export let definition
  export let quickInfo
</script>

<style>
  div {
    position: relative;
    /* Set z-index to -1 makes GitLab occurrence not show */
    /* z-index: -1; */
  }
</style>

<div
  style={`margin-top:${paddingTop}px;margin-left:${paddingLeft}px;width:${wrapperWidth}px`}
  bind:this={el}>
  {#if definition}
    <span
      style={toStyleText({
        position: 'absolute',
        background: colors.lineBg,
        left: 0,
        width: lineWidth - 20,
        height: lineHeight,
        top: definition.line * lineHeight,
      })} />
  {/if}
  {#each occurrences as occurrence}
    <span
      style={toStyleText({
        position: 'absolute',
        background: occurrence.isWriteAccess ? colors.occurrenceWrite : colors.occurrenceRead,
        width: occurrence.width * fontWidth + 'px',
        height: lineHeight + 'px',
        top: occurrence.range.line * lineHeight + 'px',
        left: occurrence.range.character * fontWidth + 'px',
      })} />
  {/each}
  {#if quickInfo && quickInfo.range}
    <div
      style={toStyleText({
        position: 'absolute',
        background: colors.quickInfoBg,
        top: quickInfo.range.line * lineHeight,
        left: quickInfo.range.character * fontWidth,
        width: quickInfo.width * fontWidth,
        height: lineHeight,
      })} />
  {/if}
</div>
