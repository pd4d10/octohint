/**
 * This file is for Safari extension
 * It can't specify content script of different web page
 * So we have to check whether current page is GitHub, GitLab or Bitbucket
 */

switch (location.host) {
  case 'github.com':
    require('./platforms/github')
    break
  case 'gitlab.com':
    require('./platforms/gitlab')
    break
  case 'bitbucket.org':
    require('./platforms/bitbucket')
    break
}
