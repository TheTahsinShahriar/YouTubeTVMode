// Unified JSON.parse middleware + _yttv rebind (single loop)
(() => {
  'use strict';

  const ns = window.__yttvm || (window.__yttvm = {});
  const handlers = [];
  const nativeParse = JSON.parse.bind(JSON);

  function runHandlers(result) {
    if (!result || typeof result !== 'object') return result;
    let current = result;
    for (let i = 0; i < handlers.length; i++) {
      const h = handlers[i];
      try {
        const next = h.fn(current);
        if (next !== undefined) current = next;
      } catch (e) {
        ns.error?.(`json handler "${h.name}" failed`, e);
      }
    }
    return current;
  }

  function wrappedParse() {
    const result = nativeParse.apply(null, arguments);
    return runHandlers(result);
  }

  JSON.parse = wrappedParse;
  window.JSON.parse = wrappedParse;

  let delay = 100;
  let foundOnce = false;
  let timer = null;

  function patchYttv() {
    let found = false;
    try {
      for (const key in window._yttv || {}) {
        const entry = window._yttv[key];
        if (entry?.JSON) {
          if (entry.JSON.parse !== wrappedParse) {
            entry.JSON.parse = wrappedParse;
          }
          found = true;
        }
      }
    } catch {
      /* ignore */
    }

    if (found) {
      foundOnce = true;
      delay = 3000;
    } else if (foundOnce) {
      delay = 5000;
    } else {
      delay = Math.min(delay * 1.5, 2000);
    }

    timer = setTimeout(patchYttv, delay);
  }

  patchYttv();

  ns.json = {
    register(name, fn, priority = 100) {
      handlers.push({ name, fn, priority });
      handlers.sort((a, b) => a.priority - b.priority);
    },
    nativeParse,
    /** Parse without running middleware (safe cloning). */
    rawParse(text) {
      return nativeParse(text);
    },
    stop() {
      if (timer) clearTimeout(timer);
    }
  };
})();
