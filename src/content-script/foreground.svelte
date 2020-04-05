<script>
  import { onMount, onDestroy } from 'svelte'
  import { toStyleText } from './utils'
  export let fontWidth
  export let fontFamily
  export let lineHeight
  export let paddingLeft
  export let wrapperWidth
  export let bottom

  function getColorFromKind(kind) {
    switch (kind) {
      case 'keyword':
        return '#00f'
      case 'punctuation':
        return '#000'
      default:
        return '#001080'
    }
  }

  export let quickInfo

  $: style =
    quickInfo &&
    quickInfo.range &&
    toStyleText({
      'font-family': fontFamily,
      left: quickInfo.range.character * fontWidth + 'px',
      ...(() => {
        // TODO: Fix https://github.com/Microsoft/TypeScript/blob/master/Gulpfile.ts
        // TODO: Show info according to height
        // TODO: Make quick info could be copied
        // For line 0 and 1, show info below, this is tricky
        // To support horizontal scroll, our root DOM must be inside $('.blob-wrapper')
        // So quick info can't show outside $('.blob-wrapper')
        const positionStyle = {}
        if (quickInfo.range.line < 2) {
          positionStyle.top = (quickInfo.range.line + 1) * lineHeight + 'px'
        } else {
          positionStyle.bottom = 0 - quickInfo.range.line * lineHeight + 'px'
        }

        return positionStyle
      })(),
    })
</script>

<style>
  .octohint-foreground {
    position: relative;
    /* width: wrapperWidth, // Important, make quick info show as wide as possible */
    /* // zIndex: 2, */
  }
  .octohint-quickinfo {
    white-space: pre-wrap;
    position: absolute;
    background-color: #efeff2;
    border: 1px solid #c8c8c8;
    font-size: 12px;
    padding: 2px 4px;
    max-width: 500px;
    max-height: 300px;
    overflow: auto;
    word-break: break-all;
  }
</style>

<div
  class="octohint-foreground"
  style={`width:${wrapperWidth}px;left:${paddingLeft}px;bottom:${bottom}px`}>
  {#if quickInfo && quickInfo.info}
    <div {style} class="octohint-quickinfo">
      {#if typeof quickInfo.info === 'string'}
        {quickInfo.info.replace(/\\/g, '')}
      {:else}
        {#each quickInfo.info as part}
          {#if part.text === '\n'}
            <br />
          {:else}
            <span style={toStyleText({ color: getColorFromKind(part.kind) })}>{part.text}</span>
          {/if}
        {/each}
      {/if}
      <!-- JSON.parse(`"${info}"`) -->
    </div>
  {/if}
</div>
