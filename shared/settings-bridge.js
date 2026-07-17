// Page-context settings bridge (postMessage <-> content script)
(() => {
  'use strict';

  const ns = window.__yttvm || (window.__yttvm = {});
  const MSG = ns.MESSAGE || {
    PAGE: 'yttvm-page',
    CONTENT: 'yttvm-content',
    SETTINGS_CHANGE: 'yttvm-settings-change',
    TOKEN: 'yttvm-bridge-v1'
  };

  const listeners = new Set();
  const cache = {};

  function isValidEvent(event) {
    if (event.source !== window || !event.data) return false;
    if (event.data.token && event.data.token !== MSG.TOKEN) return false;
    return true;
  }

  function notify(key, value) {
    for (const cb of listeners) {
      try {
        cb(key, value, cache);
      } catch (e) {
        ns.error?.('settings listener failed', e);
      }
    }
  }

  function mergeSettings(partial) {
    Object.assign(cache, partial || {});
  }

  window.addEventListener('message', (event) => {
    if (!isValidEvent(event)) return;
    const data = event.data;

    if (data.source === MSG.CONTENT && data.type === 'SETTINGS_RESPONSE') {
      mergeSettings(data.settings || {});
      notify('*', cache);
      return;
    }

    if (data.source === MSG.SETTINGS_CHANGE) {
      cache[data.key] = data.value;
      notify(data.key, data.value);
    }
  });

  ns.settings = {
    cache,
    get(key) {
      return cache[key];
    },
    getAll() {
      return { ...cache };
    },
    set(partial) {
      mergeSettings(partial);
      window.postMessage(
        {
          source: MSG.PAGE,
          type: 'SET_SETTINGS',
          settings: partial,
          token: MSG.TOKEN
        },
        window.location.origin
      );
    },
    request() {
      window.postMessage(
        {
          source: MSG.PAGE,
          type: 'GET_SETTINGS',
          token: MSG.TOKEN
        },
        window.location.origin
      );
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    isEnabled(key) {
      return ns.resolveBool(key, cache);
    },
    getNumber(key, fallback) {
      const v = parseFloat(cache[key]);
      return !isNaN(v) ? v : fallback;
    },
    getArray(key) {
      return Array.isArray(cache[key]) ? cache[key] : [];
    }
  };

  // Initial fetch
  ns.settings.request();
})();
