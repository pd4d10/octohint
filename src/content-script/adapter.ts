import { renderToContainer } from './renderer'

const $ = (selector: string, wrapper: HTMLElement = document.body) => {
  const dom = wrapper.querySelector(selector)
  if (!dom) return null
  return dom as HTMLElement
}
const $$ = (selector: string) => {
  return document.querySelectorAll(selector)
}

function getCurrentUrl() {
  return location.protocol + '//' + location.host + location.pathname
}

// Replace `//` with `/` to simulate file system path
function getFilePath(loc: { host: string; pathname: string } = location) {
  return '/' + loc.host + loc.pathname
}

export interface RenderParams {
  container: HTMLElement
  fontDom: HTMLElement
  tabSizeDom: HTMLElement
  lineWidth: number
  lineHeight: number
  paddingLeft: number
  paddingTop: number
  codeUrl: string
  fileName: string
  // TODO: This is pretty tricky for making GitLab and Bitbucket work
  beforeRender?: () => void
}

const getGithubParams = (): RenderParams | undefined => {
  const container = $('.blob-wrapper')
  const line1 = $('#LC1')
  const tabSizeDom = $('.blob-wrapper table')
  if (!container || !line1 || !tabSizeDom) return

  const rect = line1.getBoundingClientRect()
  return {
    container,
    fontDom: line1,
    tabSizeDom,
    lineWidth: rect.width,
    lineHeight: rect.height,
    paddingLeft: 60,
    paddingTop: 0,
    codeUrl: getCurrentUrl().replace('/blob/', '/raw/'),
    fileName: getFilePath(),
  }
}

function getGithubGistParams(wrapper: HTMLElement): RenderParams | undefined {
  const container = $('.blob-wrapper', wrapper)
  const fontDom = $('.blob-wrapper .blob-code', wrapper)
  const tabSizeDom = $('.blob-wrapper table', wrapper)
  const codeAction = $('.file-actions a', wrapper)
  const fileInfo = $('.file-info', wrapper)
  if (
    !container ||
    !fontDom ||
    !tabSizeDom ||
    !codeAction ||
    !fileInfo ||
    !(codeAction instanceof HTMLAnchorElement)
  )
    return

  const codeUrl = codeAction.href
  if (!codeUrl) return

  return {
    container,
    fontDom,
    tabSizeDom,
    lineWidth: 918,
    lineHeight: 20,
    paddingLeft: 60,
    paddingTop: 0,
    codeUrl,
    fileName: getFilePath().replace(/\/$/, '') + fileInfo.innerText.trim(),
  }
}

// const BitbucketRenderer: RendererParams = {
//   getContainer: () => $('.view-lines'),
//   getFontDOM: () => $('.view-lines span'),
//   getLineWidthAndHeight: () => ({
//     width: (<HTMLElement>$('.view-lines .view-line')).offsetWidth - 43,
//     height: 18,
//   }),
//   paddingLeft: 0,
//   paddingTop: 0,
//   getCodeUrl: () => getCurrentUrl().replace('/src/', '/raw/'),
//   getFileName: getFilePath,
//   // extraBeforeRender: () => (($('.file-source .code pre') as HTMLElement).style.position = 'relative'),
// }

// // This GitLab is for old version
// // TODO: New version use dynamic loading
// const GitLabRenderer: RendererParams = {
//   getContainer: () => $('.blob-content .code'),
//   getFontDOM: () => $('#LC1'),
//   getLineWidthAndHeight: () => $('#LC1')!.getBoundingClientRect(),
//   paddingLeft: 10,
//   paddingTop: 0,
//   getCodeUrl: () => getCurrentUrl().replace('/blob/', '/raw/'),
//   getFileName: getFilePath,
//   beforeRender: () => {
//     const $code = $('.blob-content .code code') as HTMLElement
//     $code.style.position = 'relative'
//     $code.style.background = 'transparent'
//   },
// }

// let prevContainer: Element | null

// // TODO:
// const addMutationObserver = (
//   container: Element | null,
//   params: RendererParams,
//   extraCondition = true,
// ) => {
//   if (!container || !extraCondition) return

//   new MutationObserver(mutations => {
//     mutations.forEach(mutation => {
//       console.log(mutation)
//       if (mutation.type === 'childList' && mutation.addedNodes.length) {
//         // This fix GitHub trigger multi mutations sometimes while dynamic loading
//         // Check if current container equals to previous, if same then ignore
//         const container = params.getContainer()
//         if (container && prevContainer !== container) {
//           renderToContainer(params)
//           prevContainer = container
//         }
//       }
//     })
//   }).observe(container, {
//     attributes: true,
//     childList: true,
//     characterData: true,
//   })
// }

export const runAdapter = () => {
  // GitHub Gist
  if (location.host === 'gist.github.com') {
    const containers = $$('.js-gist-file-update-container')
    if (!containers) return
    containers.forEach((container) => {
      const params = getGithubGistParams(container as HTMLElement)
      if (params) {
        renderToContainer(params)
      }
    })
    return
  }

  // GitHub
  // TODO: Dynamic import
  // May be deployed at private domain, URL
  // So use DOM selector
  const params = getGithubParams()
  if (params) {
    renderToContainer(params)
    return
  }

  // GitLab
  // FIXME: Use `document.documentElement` may cause problems when DOM added by other extensions
  // this.addMutationObserver(document.documentElement, GitLabRenderer, GitLabRenderer.getContainer() !== null)

  // Direct loading, like browser go back
  // renderToContainer(GitLabRenderer)
  // return

  // Bitbucket
  // Seems Bitbucket already use monaco-editor to show code
  // this.addMutationObserver($('.react-monaco-editor-container'), BitbucketRenderer)
  // if (BitbucketRenderer.getContainer()) {
  //   new Renderer(BitbucketRenderer)
  //   return
  // }
}
