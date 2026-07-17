// Page-context bootstrap: namespace, logging, constants from YTTVM (lib/defaults.js)
(() => {
  'use strict';

  const base = globalThis.YTTVM || {};
  const debugEnabled = () => {
    try {
      return !!window.__yttvm?.settings?.cache?.debugLogging;
    } catch {
      return false;
    }
  };

  const ns = (window.__yttvm = window.__yttvm || {});

  Object.assign(ns, {
    version: '1.1.0',
    UA: base.YTTVM_USER_AGENT,
    DEFAULTS: base.DEFAULTS || {},
    DEFAULT_OFF_KEYS: base.DEFAULT_OFF_KEYS || [],
    QUALITY_OPTIONS: base.QUALITY_OPTIONS || [],
    SIDEBAR_ITEMS: base.SIDEBAR_ITEMS || [],
    SPONSOR_CATEGORIES: base.SPONSOR_CATEGORIES || [],
    MESSAGE: base.MESSAGE || {
      PAGE: 'yttvm-page',
      CONTENT: 'yttvm-content',
      SETTINGS_CHANGE: 'yttvm-settings-change',
      TOKEN: 'yttvm-bridge-v1'
    },
    resolveBool: base.resolveBool || ((key, settings) => {
      const off = (base.DEFAULT_OFF_KEYS || []).includes(key);
      return off ? settings?.[key] === true : settings?.[key] !== false;
    }),
    log(...args) {
      if (debugEnabled()) console.log('[YTTVM]', ...args);
    },
    warn(...args) {
      if (debugEnabled()) console.warn('[YTTVM]', ...args);
    },
    error(...args) {
      console.error('[YTTVM]', ...args);
    },
    info(...args) {
      // Always-on for rare important messages when debug off — no-op by default
      if (debugEnabled()) console.info('[YTTVM]', ...args);
    }
  });
})();
