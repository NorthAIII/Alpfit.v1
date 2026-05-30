const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

// pnpm default izole layout: `shared` workspace'inin transitive deps'i
// (libphonenumber-js, date-fns, date-fns-tz) `shared/node_modules`'a düşüyor;
// mobile flat-hoisted olduğu için onlar `mobile/node_modules`'a girmiyor.
// Metro'nun resolution path'ine `shared/node_modules` eklenir.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'shared/node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

// NodeNext (.js extension imports → .ts source) shimi:
// `@alpfit/shared` ve diğer TS workspace paketleri kaynak dosyalarında
// `import './x.js'` yazıyor (NodeNext zorunluluğu). Metro `.ts` aramaz,
// `.js` arar; bu shim `.js` çağrılarını `.ts/.tsx` kaynağına yönlendirir.
const origResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.js') && (moduleName.startsWith('.') || moduleName.startsWith('/'))) {
    for (const ext of ['.ts', '.tsx']) {
      const candidate = moduleName.replace(/\.js$/, ext);
      try {
        return context.resolveRequest(context, candidate, platform);
      } catch {
        // sıradaki uzantıyı dene
      }
    }
  }
  return (origResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

// Web bundler'ı test dosyalarını route olarak almasın.
config.resolver.blockList = [/.*\.test\.[jt]sx?$/, /.*\.spec\.[jt]sx?$/];

module.exports = config;
