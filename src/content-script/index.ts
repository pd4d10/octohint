// TODO: Dynamic import
if (document.querySelector('.blob-wrapper')) {
  require('./platforms/github')
} else if (document.querySelector('.blob-content')) {
  require('./platforms/gitlab')
} else if (document.querySelector('.file-source')) {
  require('./platforms/bitbucket')
}
