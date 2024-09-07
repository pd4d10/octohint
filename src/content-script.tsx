import { Viewer } from "@bytemd/react";
import { debounce, slice } from "lodash-es";
import { CSSProperties } from "react";
import { createRoot, Root } from "react-dom/client";
import { HintRequest, HintResponse } from "./types";

console.log(11111111);

const toStyleText = (obj: { [key: string]: string | number }) => {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
};

const getFontParams = (fontDom: HTMLElement) => {
  const testDom = document.createElement("span");
  testDom.innerText = "0";
  fontDom.appendChild(testDom);

  const style = getComputedStyle(testDom);
  const result = {
    width: testDom.getBoundingClientRect().width,
    family: style.fontFamily || "monospace",
  };

  testDom.remove();
  return result;
};

const getOffsetTop = (e: HTMLElement): number => {
  if (!e) {
    return 0;
  }
  const parent = e.offsetParent as HTMLElement;
  return e.offsetTop + getOffsetTop(parent);
};

interface RenderRequest {
  selector: string;
  fontSelector: string;
  paddingLeft: number;
  paddingTop: number;
  getFileName(container: HTMLElement): string;
  getCode(container: HTMLElement): Promise<string>;
}

const requests: RenderRequest[] = [
  // github, gist
  {
    selector: ".blob-wrapper table",
    fontSelector: ".blob-wrapper .blob-code",
    paddingLeft: 60,
    paddingTop: 0,
    getFileName(container) {
      const parent = container.parentElement?.parentElement;
      if (!parent) return ""; // TODO:
      const rawPath = (
        $("#raw-url", parent) // github
          ?? $(".file-actions a", parent)
      ) // gist
        ?.getAttribute("href");
      return rawPath ?? "";
    },
    async getCode(container) {
      return $$("tr>td:nth-child(2)", container).reduce((code, el) => {
        const line = el.innerText.replaceAll("\n", ""); // empty line has an extra '\n', remove it
        return code + line + "\n";
      }, "");
    },
  },
  // gitlab, gitlab snippets
  {
    selector: ".blob-content code",
    fontSelector: ".line",
    paddingLeft: 10,
    paddingTop: 0,
    getFileName(container) {
      const parent = container.closest<HTMLElement>(".file-holder");
      if (!parent) return ""; // TODO:
      const rawPath = $("[title=\"Open raw\"]", parent)?.getAttribute("href");
      return rawPath ?? "";
    },
    async getCode(container) {
      return $$(".line", container).reduce((code, el) => {
        const line = el.innerText.replaceAll("\n", ""); // empty line has an extra '\n', remove it
        return code + line + "\n";
      }, "");
    },
  },
  // bitbucket
  {
    selector: ".view-lines",
    fontSelector: ".view-line",
    paddingLeft: 0,
    paddingTop: 0,
    getFileName(container) {
      return location.host + location.pathname;
    },
    async getCode(container) {
      const res = await fetch(location.href.replace("/src/", "/raw/"));
      return res.text();
    },
  },
  // bitbucket snippets
  {
    selector: ".bb-content-container .code pre",
    fontSelector: "span",
    paddingLeft: 0,
    paddingTop: 0,
    getFileName(container) {
      const parent = container.closest<HTMLElement>(".bb-content-container");
      if (!parent) return ""; // TODO:
      const rawPath = $(".bb-content-container-header-secondary a", parent)?.getAttribute("href");
      return rawPath ?? "";
    },
    async getCode(container) {
      return container.innerText;
    },
  },
];

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

// let prevContainer: Element | null

interface InitProps {
  $background: HTMLElement;
  fontWidth: number;
  fontFamily: string;
  fileName: string;
  code: string;
  lineHeight: number;
  tabSize: number;
  offsetTop: number;
}

const initPropsMap = new WeakMap<HTMLElement, InitProps>();

/**
 * Principles:
 * Do not break DOM position as mush as possible
 * Like set `position` property to existing DOM
 *
 * <container>           +--------------------+
 *   - container padding top + border top
 *              +--------------------+
 *   <background />
 *  +-----------------------------
 *  |                padding top
 *  |              +-----------
 *  | padding left | Code area
 *  |              +----------
 *  |                padding bottom
 *  +-------------------------------
 *   <quickInfo />
 *               ---------------
 *   - container padding bottom + border bottom
 * </container>  +--------------------+
 *
 * Problems:
 * 1. Masks should not cover code
 * 2. Masks should not be selected
 * 3. Masks should follow Horizontal scroll
 * 4. Quick info overflow on first or second line
 *
 * DOM structure    - z-index
 *
 * <container>
 *   <background /> - 0
 *   ...            - 1
 *   <quickInfo />  - 2
 * </container>
 *
 * <container> and its childrens should not set background-color
 * Order: background -> other childrens(including code) -> quickInfo
 */
const init = async (e: MouseEvent) => {
  if (!(e.target instanceof HTMLElement)) return;

  for (const req of requests) {
    const container = e.target.closest<HTMLElement>(req.selector);
    if (!container) continue;

    const fontDom = $(req.fontSelector, container);
    if (!fontDom) continue;

    if (!initPropsMap.has(container) || !document.contains(container)) {
      // reset response
      response = {};

      console.log("container:", container);

      const tabSize = parseInt(getComputedStyle(fontDom).getPropertyValue("tab-size"), 10) || 8; // TODO: Firefox

      // Get font width and family
      const fontParams = getFontParams(fontDom);

      // TODO: This is pretty tricky for making GitLab and Bitbucket work
      // if (beforeRender) beforeRender()

      const containerRect = container.getBoundingClientRect();
      const wrapperWidth = `${containerRect.width - req.paddingLeft - 10}px`;

      const $background = document.createElement("div");
      $background.setAttribute(
        "style",
        toStyleText({
          position: "relative",
          // zIndex: -1, // Set z-index to -1 makes GitLab occurrence not show
          top: req.paddingTop + "px",
          left: req.paddingLeft + "px",
          width: wrapperWidth,
        }),
      );

      container.parentElement?.insertBefore($background, container);

      const lineHeight = fontDom.getBoundingClientRect().height;

      initPropsMap.set(container, {
        $background,
        fontWidth: fontParams.width,
        fontFamily: fontParams.family,
        fileName: req.getFileName(container),
        code: await req.getCode(container),
        lineHeight,
        tabSize,
        offsetTop: getOffsetTop(container) + req.paddingTop,
      });
    }

    return initPropsMap.get(container);
  }
};

const $ = (selector: string, wrapper: HTMLElement = document.body) => {
  return wrapper.querySelector<HTMLElement>(selector);
};
const $$ = (selector: string, wrapper: HTMLElement = document.body) => {
  return slice(wrapper.querySelectorAll<HTMLElement>(selector));
};

const sendMessage = async (req: HintRequest) => {
  console.log("req", req);

  return new Promise<HintResponse>((resolve) => {
    chrome.runtime.sendMessage(req, (response) => {
      console.log("res", response);
      resolve(response);
    });
  });
};

const getPosition = (e: MouseEvent, lineHeight: number, fontWidth: number, $background: HTMLElement) => {
  const rect = $background.getBoundingClientRect();

  // must be integers
  const line = Math.floor((e.clientY - rect.top) / lineHeight);
  const character = Math.floor((e.clientX - rect.left) / fontWidth);

  if (line > 0 && character > 0) {
    return { line, character };
  }
};

const isMacOS = /Mac OS X/i.test(navigator.userAgent);

const colors = {
  quickInfoBg: "rgba(173,214,255,.3)",
  occurrenceWrite: "rgba(14,99,156,.4)",
  occurrenceRead: "rgba(173,214,255,.7)",
};

function getColorFromKind(kind: string) {
  switch (kind) {
    // ts
    case "keyword":
      return "#00f";
    case "punctuation":
      return "#000";

    // css
    case "plaintext":
      return "#00f";

    default:
      return "#001080";
  }
}

let response: HintResponse = {};
let root: Root;

const handleResponse = (res: HintResponse, props: InitProps) => {
  response = { ...response, ...res };
  const { definition, occurrences, quickInfo } = response;

  if (definition) {
    window.scrollTo(0, props.offsetTop + definition.line * props.lineHeight - 80); // TODO: magic number
  }

  if (!root) root = createRoot(props.$background);

  root.render(
    <>
      {occurrences?.map((occurrence) => (
        <div
          style={{
            position: "absolute",
            background: occurrence.isWriteAccess ? colors.occurrenceWrite : colors.occurrenceRead,
            width: occurrence.width * props.fontWidth,
            height: props.lineHeight,
            top: occurrence.range.line * props.lineHeight,
            left: occurrence.range.character * props.fontWidth,
          }}
        />
      ))}
      {quickInfo && (
        <div
          style={{
            position: "absolute",
            background: colors.quickInfoBg,
            // lineHeight: '20px',
            top: quickInfo.range.line * props.lineHeight,
            left: quickInfo.range.character * props.fontWidth,
            width: quickInfo.width * props.fontWidth,
            height: props.lineHeight,
          }}
        />
      )}
      {quickInfo?.info && (
        <div
          style={{
            zIndex: 1,
            whiteSpace: "pre-wrap",
            position: "absolute",
            backgroundColor: "#efeff2",
            border: `1px solid #c8c8c8`,
            fontSize: 12,
            padding: `2px 4px`,
            fontFamily: props.fontFamily,
            left: quickInfo.range.character * props.fontWidth,
            maxWidth: 500,
            maxHeight: 300,
            overflow: "auto",
            wordBreak: "break-all",
            ...(() => {
              // TODO: Fix https://github.com/Microsoft/TypeScript/blob/master/Gulpfile.ts
              // TODO: Show info according to height
              // TODO: Make quick info could be copied
              // For line 0 and 1, show info below, this is tricky
              // To support horizontal scroll, our root DOM must be inside $('.blob-wrapper')
              // So quick info can't show outside $('.blob-wrapper')
              const positionStyle: CSSProperties = {};
              if (quickInfo.range.line < 2) {
                positionStyle.top = (quickInfo.range.line + 1) * props.lineHeight;
              } else {
                positionStyle.bottom = 0 - quickInfo.range.line * props.lineHeight;
              }

              return positionStyle;
            })(),
          }}
        >
          {
            typeof quickInfo.info === "string"
              ? quickInfo.info.replace(/\\/g, "")
              : quickInfo.info.map((part) => {
                if (part.text === "\n") {
                  return <br />;
                }
                // css
                if (part.kind === "markdown") {
                  return <Viewer value={part.text} />; // TODO: styles
                }
                return <span style={{ color: getColorFromKind(part.kind) }}>{part.text}</span>;
              })

            // JSON.parse(`"${info}"`)
          }
        </div>
      )}
    </>,
  );
};

// click: show occurrences
// if meta key is pressed, also show definition and scroll to it
document.addEventListener("click", async (e) => {
  const initProps = await init(e);
  if (!initProps) return;

  console.log("click", e);

  const position = getPosition(e, initProps.lineHeight, initProps.fontWidth, initProps.$background);
  if (!position) return;

  const res = await sendMessage({
    type: "click",
    file: initProps.fileName,
    meta: isMacOS ? e.metaKey : e.ctrlKey,
    code: initProps.code,
    tabSize: initProps.tabSize,
    ...position,
  });
  handleResponse(res, initProps);

  // TODO: Exclude click event triggered by selecting text
  // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
  // if (window.getSelection().toString()) {
  //   return
  // }
});

// mousemove: show quick info on stop
document.addEventListener(
  "mousemove",
  debounce(async (e: MouseEvent) => {
    const initProps = await init(e);
    if (!initProps) return;

    // console.log('mousemove', e)
    const position = getPosition(e, initProps.lineHeight, initProps.fontWidth, initProps.$background);
    if (!position) return;

    const res = await sendMessage({
      type: "hover",
      file: initProps.fileName,
      code: initProps.code,
      tabSize: initProps.tabSize,
      ...position,
    });
    handleResponse(res, initProps);
  }, 300),
);

// mouseout: hide quick info on leave
document.addEventListener("mouseout", async (e) => {
  const initProps = await init(e);
  if (!initProps) return;

  // console.log('mouseout', e)
  handleResponse({ quickInfo: undefined }, initProps);
});

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
