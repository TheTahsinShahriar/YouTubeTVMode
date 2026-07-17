// Content Script — feature coordinator, settings bridge, conditional injection
(() => {
  'use strict';

  const Y = globalThis.YTTVM || {};
  const MSG = Y.MESSAGE || {
    PAGE: 'yttvm-page',
    CONTENT: 'yttvm-content',
    SETTINGS_CHANGE: 'yttvm-settings-change',
    TOKEN: 'yttvm-bridge-v1'
  };
  const RELOAD_KEYS = Y.RELOAD_REQUIRED_KEYS || [];
  const INSTANT_KEYS = Y.INSTANT_APPLY_KEYS || [];

  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(src);
      script.async = false;
      script.onload = () => {
        script.remove();
        resolve();
      };
      script.onerror = () => {
        console.error('[YTTVM] Failed to load', src);
        reject(new Error(src));
      };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  async function injectScripts(list) {
    for (const src of list) {
      try {
        await injectScript(src);
      } catch {
        /* continue */
      }
    }
  }

  const isTVUrl = window.location.href.includes('youtube.com/tv');

  const SHARED = [
    'lib/defaults.js',
    'lib/thumbnail-url.js',
    'shared/page-init.js',
    'shared/settings-bridge.js',
    'shared/json-interceptor.js',
    'shared/player-utils.js'
  ];

  /** Always early (before first paint / network identity). */
  const CRITICAL = [
    'features/deviceSpoof.js',
    'features/highQualityThumbnails.js'
  ];

  const OPTIONAL = [
    {
      src: 'features/backgroundPlayback.js',
      setting: 'backgroundPlaybackEnabled',
      defaultOn: true
    },
    { src: 'features/leanbackMode.js', always: true },
    { src: 'features/adblock.js', setting: 'adBlockEnabled', defaultOn: true },
    {
      src: 'features/forceResolution.js',
      setting: 'forceResolutionEnabled',
      defaultOn: true
    },
    {
      src: 'features/keyRemapping.js',
      setting: 'keyRemappingEnabled',
      defaultOn: true
    },
    { src: 'features/playbackSpeed.js', always: true },
    { src: 'features/hideGuide.js', always: true },
    {
      src: 'features/sponsorblock.js',
      setting: 'sponsorBlockEnabled',
      defaultOn: false
    },
    { src: 'settingsIntegration.js', always: true }
  ];

  function shouldInject(entry, storage) {
    if (entry.always) return true;
    const key = entry.setting;
    if (!key) return true;
    const val = storage[key];
    if (entry.defaultOn) return val !== false;
    return val === true;
  }

  if (isTVUrl) {
    document.documentElement.dataset.yttvmLeanbackCss = chrome.runtime.getURL(
      'styles/leanback.css'
    );

    (async () => {
      // Fire SHARED and CRITICAL in parallel for faster startup
      await Promise.all([injectScripts(SHARED), injectScripts(CRITICAL)]);

      chrome.storage.local.get(null, async (storage) => {
        if (chrome.runtime.lastError) storage = {};
        const optional = OPTIONAL.filter((e) => shouldInject(e, storage)).map((e) => e.src);
        await injectScripts(optional);
      });
    })();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      try {
        chrome.runtime.sendMessage({ type: 'WINDOW_RESIZED' }, () => {
          void chrome.runtime.lastError;
        });
      } catch {
        /* context invalidated */
      }
    }, 100);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (RELOAD_KEYS.some((key) => changes[key])) {
      setTimeout(() => window.location.reload(), 100);
      return;
    }

    if (INSTANT_KEYS.some((key) => changes[key])) {
      Object.keys(changes).forEach((key) => {
        if (!INSTANT_KEYS.includes(key)) return;
        window.postMessage(
          {
            source: MSG.SETTINGS_CHANGE,
            key,
            value: changes[key].newValue,
            token: MSG.TOKEN
          },
          window.location.origin
        );
      });
    }
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.source !== MSG.PAGE) return;
    if (event.data.token && event.data.token !== MSG.TOKEN) return;

    if (event.data.type === 'GET_SETTINGS') {
      chrome.storage.local.get(null, (result) => {
        window.postMessage(
          {
            source: MSG.CONTENT,
            type: 'SETTINGS_RESPONSE',
            settings: result,
            token: MSG.TOKEN
          },
          window.location.origin
        );

        const push = (key, value) => {
          window.postMessage(
            {
              source: MSG.SETTINGS_CHANGE,
              key,
              value,
              token: MSG.TOKEN
            },
            window.location.origin
          );
        };

        push('leanbackModeEnabled', result.leanbackModeEnabled === true);
        push('disabledSidebarContents', result.disabledSidebarContents || []);
        push('playbackSpeed', result.playbackSpeed || 1.0);
        push(
          'highQualityThumbnailsEnabled',
          result.highQualityThumbnailsEnabled !== false
        );
        push('keyRemappingEnabled', result.keyRemappingEnabled !== false);
        push('adBlockEnabled', result.adBlockEnabled !== false);
        push('forceResolutionEnabled', result.forceResolutionEnabled !== false);
        push('preferredVideoQuality', result.preferredVideoQuality || 'highres');
        push('sponsorBlockEnabled', result.sponsorBlockEnabled === true);
        push(
          'sponsorBlockCategories',
          result.sponsorBlockCategories || Y.DEFAULTS?.sponsorBlockCategories
        );
        push('hidePaidPromotion', result.hidePaidPromotion !== false);
        push('hideEndScreenCards', result.hideEndScreenCards === true);
        push('hideSigninReminder', result.hideSigninReminder === true);
        push('debugLogging', result.debugLogging === true);
      });
    } else if (event.data.type === 'SET_SETTINGS') {
      chrome.storage.local.set(event.data.settings || {});
    }
  });
})();
