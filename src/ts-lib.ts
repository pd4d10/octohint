// Seperate this file because Firefox has a JS bundle size limit of 4M
// TODO: Use Webpack code split instead of global variable
// TODO: Go to definition

window.TS_LIB = [
  // ES and DOM standard
  require('raw-loader!typescript/lib/lib.d.ts'),
  require('raw-loader!typescript/lib/lib.dom.d.ts'),
  require('raw-loader!typescript/lib/lib.dom.iterable.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.collection.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.core.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.generator.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.iterable.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.promise.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.proxy.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.reflect.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.symbol.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.symbol.wellknown.d.ts'),
  require('raw-loader!typescript/lib/lib.es2016.array.include.d.ts'),
  require('raw-loader!typescript/lib/lib.es2016.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.object.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.sharedmemory.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.string.d.ts'),
  require('raw-loader!typescript/lib/lib.es5.d.ts'),
  require('raw-loader!typescript/lib/lib.es6.d.ts'),
  require('raw-loader!typescript/lib/lib.webworker.d.ts'),
  // Node.js
  require('raw-loader!@types/node/index.d.ts'),
  // Brower extensions
  require('raw-loader!@types/chrome/index.d.ts'),
  require('raw-loader!@types/safari-extension/index.d.ts'),
  require('raw-loader!@types/safari-extension-content/index.d.ts'),
].join('\n')
