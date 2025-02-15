const loaders = new Map();
const loadedModules = new Map();
const pendingLoaders = new Map();

export default function moduleLoader(name) {
  return {
    get() {
      const module = loadedModules.get(name);
      return module == null ? null : module.default;
    },
    load() {
      const loader = loaders.get(name);
      if (loader == null) {
        const promise = new Promise((resolve) => {
          loaders.set(name, {
            kind: 'pending',
            resolve,
          });
        });
        pendingLoaders.set(name, promise);
        return promise;
      } else if (loader.kind == 'registered') {
        return loader.loaderFn().then((module) => {
          loadedModules.set(name, module);
          return module.default;
        });
      } else if (loader.kind == 'pending') {
        return pendingLoaders.get(name);
      }
    },
  };
}

export function registerLoader(name, loaderFn) {
  const loader = loaders.get(name);
  if (loader == null) {
    loaders.set(name, {
      kind: 'registered',
      loaderFn,
    });
  } else if (loader.kind === 'pending') {
    loaderFn().then((module) => {
      loadedModules.set(name, module);
      pendingLoaders.delete(name);
      loader.resolve(module.default);
    });
  }
}
