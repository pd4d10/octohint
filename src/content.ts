/**
 * This file is for Safari extension
 * It can't specify content script of different web page
 * So we have to check whether current page is GitHub, GitLab or Bitbucket
 */

// switch (location.host) {
//   case 'github.com':
//     require('./platforms/github')
//     break
//   case 'gitlab.com':
//     require('./platforms/gitlab')
//     break
//   case 'bitbucket.org':
//     require('./platforms/bitbucket')
//     break
// }

// let type: 'github' | 'gitlab' | 'bitbucket'

// enum Type {
//   github,
//   gitlab,
//   bitbucket
// }

// let type: Type

if (document.querySelector('.blob-wrapper')) {
  require('./platforms/github')
} else if (document.querySelector('.blob-content')) {
  require('./platforms/gitlab')
} else if (document.querySelector('.file-source')) {
  require('./platforms/bitbucket')
}
